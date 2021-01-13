"use strict";

const { BadRequestError } = require("../expressError");

/** Change data object passed into new object 
 * of sql update variables ("first_name"=$1, ...) 
 * and array of values
 * 
 * takes: data object of values to update, column names that require snake case from table being updated
 * dataToUpdate: {
 *    "num_employees": 2,
 *    "logoUrl": ''
 * }
 * 
 * jsToSql: {
          numEmployees: "num_employees",
          logoUrl: "logo_url",
        }
 * 
 * returns:
 *  {
 *    setCols: string=>'column_name=$1',
 *    values: array of values from data object passed
 * }
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

/* Formatting companies search values for a query */

function sqlFormatSearchQuery (dataToSearch) {
  
  const keys = Object.keys(dataToSearch);
  if ((keys.length === 0) ||
      (dataToSearch.minEmployees > dataToSearch.maxEmployees)) {
        throw new BadRequestError("Invalid search!");
  }

  let conditions = [];
  for(let i = 0; i < keys.length; i++) {
  
    if (keys[i].startsWith("name")) {
      conditions.push(`"name" ILIKE '%' || $${i + 1} || '%'`);
    } else if (keys[i].startsWith("min")) {
      conditions.push(`"num_employees">$${i + 1}`);
    } else if (keys[i].startsWith("max")) {
      conditions.push(`"num_employees"<$${i + 1}`);
    }

  }
  
  return {
    setConditions: conditions.join(' AND '),
    values: Object.values(dataToSearch)
  }
}

//helper funcition


module.exports = { 
                   sqlForPartialUpdate,
                   sqlFormatSearchQuery 
                  };
