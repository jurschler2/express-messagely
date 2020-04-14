/** User class for message.ly */

const db = require("../db");
const ExpressError = require("../expressError");
const bcrypt = require("bcrypt");

/** User of the site. */

class User {

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
        VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
        RETURNING username, password, first_name, last_name, phone`,
        [username, hashedPassword, first_name, last_name, phone]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`There was a problem: ${username}`, 404);
    }

    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 

    const result = await db.query(
      `SELECT password FROM users
        WHERE username = $1`,
        [username]
    );
    
      let user = result.rows[0];
      return user && await bcrypt.compare(password, user.password);
    }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 

    const result = await db.query(
      `UPDATE users SET last_login_at = current_timestamp
        WHERE username = $1
        RETURNING username, last_login_at`,
        [username]
    );
    
    if (!result.rows[0]) {
      throw new ExpressError(`There is no user: ${username}`, 404);
    }
    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {

    const result = await db.query(
      `SELECT username, first_name, last_name 
       FROM users`
    );

    if (!result.rows[0]) {
      throw new ExpressError(`There are no users`, 404);
    }
    return result.rows;

   }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 

    const result = await db.query(
      `SELECT username, 
              first_name, 
              last_name, 
              phone, 
              join_at, 
              last_login_at 
        FROM users
        WHERE username = $1`,
        [username]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`There is no user: ${username}`, 404);
    }
    return result.rows[0];

  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 

    const result = await db.query(
      `SELECT m.id, 
              t.username, 
              t.first_name, 
              t.last_name, 
              t.phone, 
              m.body, 
              m.sent_at, 
              m.read_at 
        FROM users AS f
          LEFT JOIN messages AS m ON f.username = m.from_username
          JOIN users AS t ON t.username = m.to_username
        WHERE f.username = $1`,
        [username]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`There is no user: ${username}`, 404);
    }
    return result.rows.map(m => ({body: m.body, id: m.id, sent_at: m.sent_at, read_at: m.read_at, to_user: {username: m.username, first_name: m.first_name, last_name: m.last_name, phone: m.phone}}));

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { 

    const result = await db.query(
      `SELECT m.id, 
              f.username, 
              f.first_name, 
              f.last_name, 
              f.phone, 
              m.body, 
              m.sent_at, 
              m.read_at 
        FROM users AS t
          LEFT JOIN messages AS m ON t.username = m.to_username
          JOIN users AS f ON f.username = m.from_username
        WHERE t.username = $1`,
        [username]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`There is no user: ${username}`, 404);
    }
    return result.rows.map(m => ({body: m.body, id: m.id, sent_at: m.sent_at, read_at: m.read_at, from_user: {username: m.username, first_name: m.first_name, last_name: m.last_name, phone: m.phone}}));

  }
}


module.exports = User;