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
    company_handle: "c1",
  };

  test("works", async function () {
    let job = await Job.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`);
    expect(result.rows).toEqual([
      {
        id: expect.Any(Number),
        title: "new",
        salary: 1,
        equity: .01,
        company_handle: "c1",
      },
    ]);
  });

  test("bad request with dupe", async function () {
    try {
      await Job.create(newJob);
      await Job.create(newJob);
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/********************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: expect.Any(Number),
        title: "j1",
        salary: 10,
        equity: .01,
        company_handle: "c1",
      },
      {
        id: expect.Any(Number),
        title: "j2",
        salary: 12,
        equity: .02,
        company_handle: "c2",
      },
      {
        id: expect.Any(Number),
        title: "j3",
        salary: 13,
        equity: .03,
        company_handle: "c3",
      },
    ]);
  });
});


/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get("j1");
    expect(job).toEqual({
      id: expect.Any(Number),
      title: "j1",
      salary: 10,
      equity: .01,
      company_handle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: 'update',
    salary: 100,
    equity: 0,
  };

  test("works", async function () {
    let job = await Job.update("j1", updateData);
    expect(job).toEqual({
      id: expect.Any(Number),
      company_handle: "c1",
      ...updateData,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);
    expect(result.rows).toEqual([{
      id: expect.Any(Number),
      company_handle: "c1",
      ...updateData,
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "update",
      salary: 1,
      equity: null,
    };

    let job = await Job.update("j1", updateDataSetNulls);
    expect(job).toEqual({
      id: expect.Any(Number),
      company_handle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c1'`);
    expect(result.rows).toEqual([{
      id: expect.Any(Number),
      company_handle: "c1",
      ...updateDataSetNulls,
    }]);
  });

  test("not found if no such Job", async function () {
    try {
      await Job.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove("j1");
    const res = await db.query(
        "SELECT title FROM jobs WHERE title='j1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
