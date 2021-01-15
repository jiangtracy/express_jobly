"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
  const newJob = {
    title: "new",
    salary: 1,
    equity: .01,
    companyHandle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual({
      id: expect.any(Number),
      title: "new",
      salary: 1,
      equity: "0.01",
      companyHandle: "c1",
    });

    const result = await db.query(
      `SELECT id, 
              title, 
              salary, 
              equity, 
              company_handle AS "companyHandle"
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        id: expect.any(Number),
        title: "new",
        salary: 1,
        equity: "0.01",
        companyHandle: "c1",
      },
    ]);
  });
});

/********************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.any(Number),
        title: "j1",
        salary: 10,
        equity: "0.01",
        companyHandle: "c1",
      },
      {
        id: expect.any(Number),
        title: "j2",
        salary: 12,
        equity: "0.02",
        companyHandle: "c2",
      },
      {
        id: expect.any(Number),
        title: "j3",
        salary: 13,
        equity: "0.03",
        companyHandle: "c3",
      },
    ]);
  });
});


/************************************** get */

describe("get", function () {
  
  test("works", async function () {
    const jobRes = await db.query(
      `SELECT id
        FROM jobs
        WHERE title='j1'`
    );
    const j1Id = jobRes.rows[0].id;
    let job = await Job.get(j1Id);

    expect(job).toEqual({
      id: j1Id,
      title: "j1",
      salary: 10,
      equity: "0.01",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if invalid input", async function () {
    try {
      await Job.get("notANumber");
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  
  test("works", async function () {
    const jobRes = await db.query(
      `SELECT id
        FROM jobs
        WHERE title='j1'`
    );
    const j1Id = jobRes.rows[0].id;
  
    const updateData = {
      title: 'update',
      salary: 100,
      equity: 0,
    };
    let job = await Job.update(j1Id, updateData);
    expect(job).toEqual({
      id: j1Id,
      title: 'update',
      salary: 100,
      equity: "0",
      companyHandle: "c1",
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);
    expect(result.rows).toEqual([{
      id: j1Id,
      title: 'update',
      salary: 100,
      equity: "0",
      company_handle: "c1",
    }]);
  });

  test("works: null fields", async function () {
    const jobRes = await db.query(
      `SELECT id
        FROM jobs
        WHERE title='j1'`
    );
    const j1Id = jobRes.rows[0].id;

    const updateDataSetNulls = {
      title: "update",
      salary: 1,
      equity: null,
    };

    let job = await Job.update(j1Id, updateDataSetNulls);
    expect(job).toEqual({
      id: j1Id,
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);
    expect(result.rows).toEqual([{
      id: j1Id,
      company_handle: "c1",
      ...updateDataSetNulls,
    }]);
  });

  test("bad request if invalid input", async function () {
    try {
      await Job.update("nope", {title: "update"});
      fail();
    } catch (err) {
      console.log("error", err);
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    const jobRes = await db.query(
      `SELECT id
        FROM jobs
        WHERE title='j1'`
    );
    const j1Id = jobRes.rows[0].id;

    try {
      await Job.update(j1Id, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    const jobRes = await db.query(
      `SELECT id
        FROM jobs
        WHERE title='j1'`
    );
    const j1Id = jobRes.rows[0].id;
    await Job.remove(j1Id);
    const res = await db.query(
        "SELECT title FROM jobs WHERE title='j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(-1);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request if invalid input type", async function () {
    try {
      await Job.remove("notAValidId");
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});
