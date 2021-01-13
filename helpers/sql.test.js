"use strict";

const { sqlForPartialUpdate } = require('./sql');
const { BadRequestError } = require('../expressError');

let goodData;
let goodjsToSql;

describe('sqlForPartialUpdate', function () {
  
  beforeAll(function () {
    goodData = {
      "name": "update_name_check",
      "num_employees": 2,
      "logoUrl": ''
    }
    goodjsToSql = {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    }
  })

  test('works with proper params', function () {
    expect(sqlForPartialUpdate(goodData, goodjsToSql)).toEqual({
      "setCols": "\"name\"=$1, \"num_employees\"=$2, \"logo_url\"=$3",
      "values": ["update_name_check", 2, '']
    })
  });

  test('does not work with improper data types', function() {
    try {
      sqlForPartialUpdate(0, ['wrong']);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

});