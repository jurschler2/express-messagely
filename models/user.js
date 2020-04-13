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
      `INSERT INTO users (username, password, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5)
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
        WHERE username = $1
        RETURNING password`,
        [username]
    );

    if (!result.rows[0]) {
      throw new ExpressError(`There is no user: ${username}`, 404);
    }

    const dbPassword = result.rows[0].password;

    if (await bcrypt.compare(password, dbPassword) === true)  {
      return true;
    } else {
      return false;
    }

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
      `SELECT username, first_name, last_name, phone FROM users`
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
      `SELECT username, first_name, last_name, phone, join_at, last_login_at FROM users
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
      `SELECT m.id, m.to_username, m.body, m.sent_at, m.read_at FROM users AS u
        LEFT JOIN messages AS m ON u.username = m.from_username
        WHERE username = $1
        `,
        [username]
    );

  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) { }
}


module.exports = User;