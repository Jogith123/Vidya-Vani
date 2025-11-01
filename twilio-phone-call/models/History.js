/**
 * History Model
 * Handles all database operations for question/answer history
 */

const { getDatabase } = require('../database/connection');

/**
 * History document schema
 * @typedef {Object} HistoryDocument
 * @property {string} user_id - User's phone number (caller's number, not Twilio number)
 * @property {string} subject - Question subject (automatically classified: Math, Physics, Chemistry, Biology, History, Geography, Computer Science, English, Economics, Political Science, Environmental Science, General Knowledge, etc.)
 * @property {string} question - User's question text
 * @property {string} response - AI-generated response
 * @property {Date} timestamp - When the interaction happened
 */

class History {
  /**
   * Get the history collection
   * @returns {Collection|null}
   */
  static getCollection() {
    const db = getDatabase();
    return db ? db.collection('history') : null;
  }

  /**
   * Insert a new question/answer record
   * @param {HistoryDocument} document - History document to insert
   * @returns {Promise<Object>} Insert result
   */
  static async insertOne(document) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    return await collection.insertOne(document);
  }

  /**
   * Find history records by user ID
   * @param {string} userId - User's phone number
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of history documents
   */
  static async findByUserId(userId, limit = 100) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Find history records by user ID and subject
   * @param {string} userId - User's phone number
   * @param {string} subject - Subject name (case-insensitive)
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of history documents
   */
  static async findByUserIdAndSubject(userId, subject, limit = 5) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection
      .find({ 
        user_id: userId, 
        subject: { $regex: new RegExp(subject, 'i') }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Get statistics by subject for a user
   * @param {string} userId - User's phone number
   * @returns {Promise<Array>} Array of subject statistics
   */
  static async getSubjectStats(userId) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection.aggregate([
      { $match: { user_id: userId } },
      { $group: { 
          _id: '$subject', 
          count: { $sum: 1 },
          lastQuestion: { $last: '$question' },
          lastTimestamp: { $last: '$timestamp' }
      }},
      { $sort: { count: -1 } }
    ]).toArray();
  }

  /**
   * Get total question count for a user
   * @param {string} userId - User's phone number
   * @returns {Promise<number>} Total question count
   */
  static async getQuestionCount(userId) {
    const collection = this.getCollection();
    if (!collection) {
      return 0;
    }

    return await collection.countDocuments({ user_id: userId });
  }

  /**
   * Delete all records for a user (for testing/cleanup)
   * @param {string} userId - User's phone number
   * @returns {Promise<Object>} Delete result
   */
  static async deleteByUserId(userId) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    return await collection.deleteMany({ user_id: userId });
  }

  /**
   * Get recent questions across all subjects
   * @param {string} userId - User's phone number
   * @param {number} limit - Maximum number of records to return
   * @returns {Promise<Array>} Array of history documents
   */
  static async getRecentQuestions(userId, limit = 10) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    return await collection
      .find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
  }

  /**
   * Create a new history document
   * @param {string} userId - User's phone number
   * @param {string} subject - Question subject
   * @param {string} question - User's question
   * @param {string} response - AI response
   * @returns {HistoryDocument} History document
   */
  static createDocument(userId, subject, question, response) {
    return {
      user_id: userId,
      subject: subject,
      question: question,
      response: response,
      timestamp: new Date()
    };
  }

  /**
   * Update or insert question for a user and subject
   * If document exists for user+subject, adds question to qs array
   * Otherwise creates new document
   * @param {string} userId - User's phone number
   * @param {string} subject - Question subject
   * @param {string} question - User's question
   * @param {string} response - AI response
   * @returns {Promise<Object>} Update result
   */
  static async upsertQuestion(userId, subject, question, response) {
    const collection = this.getCollection();
    if (!collection) {
      throw new Error('Database not connected');
    }

    const document = this.createDocument(userId, subject, question, response);
    return await collection.insertOne(document);
  }

  /**
   * Get all questions for a user and subject
   * @param {string} userId - User's phone number
   * @param {string} subject - Subject name
   * @returns {Promise<Array<string>>} Array of questions
   */
  static async getQuestionsBySubject(userId, subject, limit = 50) {
    const collection = this.getCollection();
    if (!collection) {
      return [];
    }

    const docs = await collection
      .find({ 
        user_id: userId, 
        subject: { $regex: new RegExp(subject, 'i') }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();

    return docs.map(doc => doc.question);
  }
}

module.exports = History;
