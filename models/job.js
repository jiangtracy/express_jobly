'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for jobs. */

class Job {
   /** Create a company (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws BadRequestError if company already in database.
   * */

   static async create({ title, salary, equity, companyHandle }) {
      const result = await db.query(
         `INSERT INTO jobs
       ( title, salary, equity, company_handle )
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle as "companyHandle"`,
         [title, salary, equity, companyHandle]
      );

      const job = result.rows[0];

      return job;
   }

   /* Formatting jobs search values for a query 
  * Change data object passed into new object 
  * of sql condition variables ("salary" > $1, ...) 
  * and array of values
  * 
  * takes: data object of values to search
  * dataToSearch: {
  *    "title": "JobName",
  *    "salary": 10000,
  *    "hasEquity": true,
  * }
  * 
  * returns:
  * {
      conditions: string => `"title" ILIKE '%' || $1 || '%' AND "salary" >= $2 AND "equity" > 0`
      values: array of values from data object passed
    }
  */

   static _sqlFormatSearchQuery(dataToSearch) {

      let searchValues = [];
      let whereClauseValues = [];

      if (dataToSearch.title) {
         whereClauseValues.push(`title ILIKE '%' || $${whereClauseValues.length + 1} || '%'`);
         searchValues.push(dataToSearch.title);
      }

      if (dataToSearch.salary) {
         whereClauseValues.push(`salary >= $${whereClauseValues.length + 1}`);
         searchValues.push(dataToSearch.salary);
      }

      if (dataToSearch.hasEquity) {
         whereClauseValues.push(`equity > 0`);
      }

      return {
         whereClauseValues: whereClauseValues.join(' AND '),
         values: searchValues,
      };
   }

   /** Find all jobs.
   * Returns [{ id, title, salary, equity, companyHandle }
   *, ...]
   */

   static async findAll(data={}) {
      const { whereClauseValues, values } = Job._sqlFormatSearchQuery(data);

      const whereClause = values.length !== 0 ? `WHERE ${whereClauseValues}` : '';

      const jobResults = await db.query(
         `SELECT id, 
              title, 
              salary, 
              equity, 
              company_handle as "companyHandle"
       FROM jobs
       ${whereClause}
       ORDER BY "companyHandle"`, values
      );

      return jobResults.rows;
   }

   /** Given an id, return data about the job.
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

   static async get(id) {
      id = Number(id);
      if (!id) {
         throw new BadRequestError(`Job id must be an integer.`)
      }

      const jobResult = await db.query(
         `SELECT id, 
              title, 
              salary, 
              equity, 
              company_handle as "companyHandle"
       FROM jobs
       WHERE id = $1`,
         [id]
      );

      const job = jobResult.rows[0];

      if (jobResult.rows.length === 0) {
         throw new NotFoundError(`No job: ${id}`)
      };

      return job;
   }

   /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

   static async update(id, data) {
      id = Number(id);
      if (!id) {
         throw new BadRequestError(`Job id must be an integer.`)
      }

      const { setCols, values } = sqlForPartialUpdate(data, {
         companyHandle: 'company_handle'
      });

      const idVarIdx = '$' + (values.length + 1);

      const querySql = `UPDATE jobs
                      SET ${setCols}
                      WHERE id = ${idVarIdx}
                      RETURNING id, 
                                title, 
                                salary, 
                                equity, 
                                company_handle as "companyHandle" `;
      const result = await db.query(querySql, [...values, id]);
      const job = result.rows[0];

      if (result.rows.length === 0) throw new NotFoundError(`No job: ${id}`);

      return job;
   }

   /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

   static async remove(id) {
      id = Number(id);
      if (!id) {
         throw new BadRequestError(`Job id must be an integer.`)
      }

      const result = await db.query(
         `DELETE 
           FROM jobs
           WHERE id = $1
           RETURNING id`,
         [id]
      );

      if (result.rows.length === 0) throw new NotFoundError(`No job: ${id}`);
   }
}

module.exports = Job;
