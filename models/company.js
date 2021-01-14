"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlFormatSearchQuery } = require("../helpers/sql");


/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
          `SELECT handle
           FROM companies
           WHERE handle = $1`,
        [handle]);

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
          `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
        [
          handle,
          name,
          description,
          numEmployees,
          logoUrl,
        ],
    );
    const company = result.rows[0];

    return company;
  }

  /* Formatting companies search values for a query 
  * Change data object passed into new object 
  * of sql condition variables ("num_employees"<$1, ...) 
  * and array of values
  * 
  * takes: data object of values to search
  * at least one of these keys needs to be passed in
  * Both minEmployees and maxEmployees are exclusive
  * dataToSearch: {
  *    "name": "companyName",
  *    "minEmployees": 2,
  *    "maxEmployees": 10,
  * }
  * 
  * returns:
  * {
      conditions: string => `"name" ILIKE '%' || $1 || '%' AND "num_employees">$2 AND "num_employees"<$3`
      values: array of values from data object passed
    }
  */
  
  static _sqlFormatSearchQuery(dataToSearch) {
   
    if (dataToSearch.minEmployees > dataToSearch.maxEmployees) {
      throw new BadRequestError('Invalid search!');
    }

    let searchValues = [];
    let whereClauseValues = [];

      if (dataToSearch.name) {
        whereClauseValues.push(`name ILIKE '%' || $${whereClauseValues.length + 1} || '%'`);
        searchValues.push(dataToSearch.name);
      }

      if (dataToSearch.minEmployees) {
        whereClauseValues.push(`num_employees > $${whereClauseValues.length + 1}`);
        searchValues.push(dataToSearch.minEmployees);
      } 
      
      if (dataToSearch.maxEmployees) {
        whereClauseValues.push(`num_employees < $${whereClauseValues.length + 1}`);
        searchValues.push(dataToSearch.maxEmployees);
      }
    
    return {
      whereClauseValues: whereClauseValues.join(' AND '),
      values: searchValues,
    };
  }

  /** Find all companies.
   * Filter options: name, minEmployees, maxEmployees
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   */

  static async findAll(data={}) {

    const { whereClauseValues, values } = Company._sqlFormatSearchQuery(data);

    let whereClause = "";
    if(values.length !== 0 ) {
      whereClause = `WHERE ${ whereClauseValues }`;
    }

    const companiesRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ${ whereClause }
           ORDER BY name`, values);

    return companiesRes.rows;
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/


  static async get(handle) {
    const companyRes = await db.query(
          `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
        [handle]);

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
          `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
        [handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}


module.exports = Company;
