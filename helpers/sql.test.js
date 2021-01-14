'use strict';

const { sqlForPartialUpdate, sqlFormatSearchQuery } = require('./sql');
const { BadRequestError } = require('../expressError');

let goodData, goodData2, goodData3, badData;
let goodjsToSql;

describe('sqlForPartialUpdate', function() {
	beforeAll(function() {
		goodData = {
			name: 'update_name_check',
			num_employees: 2,
			logoUrl: ''
		};
		goodjsToSql = {
			numEmployees: 'num_employees',
			logoUrl: 'logo_url'
		};
	});

	test('works with proper params', function() {
		expect(sqlForPartialUpdate(goodData, goodjsToSql)).toEqual({
			setCols: `"name"=$1, "num_employees"=$2, "logo_url"=$3`,
			values: [ 'update_name_check', 2, '' ]
		});
	});

	test('does not work with improper data types', function() {
		try {
			sqlForPartialUpdate(0, [ 'wrong' ]);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});


/* Tests for sqlFormatSearchQuery */

describe('sqlForSearch', function() {
	beforeAll(function() {
		goodData = {
			name: 'gal',
			minEmployees: 800,
			maxEmployees: 900
		};

		goodData2 = {
			name: 'gal',
			maxEmployees: 900
		};

		badData = {
			name: 'gal',
			minEmployees: 900,
			maxEmployees: 800
    };
	});

	test('structures query for all search constraints passed', function() {
		expect(sqlFormatSearchQuery(goodData)).toEqual({
			"conditions": `"name" ILIKE '%' || $1 || '%' AND "num_employees">$2 AND "num_employees"<$3`,
			"values": [`gal`, 800, 900]
		});
	});

	test('works with no min num_employees', function() {
		expect(sqlFormatSearchQuery(goodData2)).toEqual({
			"conditions": `"name" ILIKE '%' || $1 || '%' AND "num_employees"<$2`,
			values: ["gal", 900]
		});
	});

	test('should response 400 if min greater than max', function() {
		try {
			sqlFormatSearchQuery(badData);
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});
