"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /companies", function () {
  const newCompany = {
    handle: "new",
    name: "New",
    logoUrl: "http://new.img",
    description: "DescNew",
    numEmployees: 10,
  };

  test("ok for admins", async function () {
    const resp = await request(app)
        .post("/companies")
        .send(newCompany)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      company: newCompany,
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .post(`/companies/`)
        .send(newCompany);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if user is not an admin", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          handle: "new",
          numEmployees: 10,
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
        .post("/companies")
        .send({
          ...newCompany,
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

 

/************************************** GET /companies */

describe("GET /companies", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/companies");
    expect(resp.body).toEqual({
      companies:
          [
            {
              handle: "c1",
              name: "C1",
              description: "Desc1",
              numEmployees: 1,
              logoUrl: "http://c1.img",
            },
            {
              handle: "c2",
              name: "C2",
              description: "Desc2",
              numEmployees: 2,
              logoUrl: "http://c2.img",
            },
            {
              handle: "c3",
              name: "C3",
              description: "Desc3",
              numEmployees: 3,
              logoUrl: "http://c3.img",
            },
          ],
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE companies CASCADE");
    const resp = await request(app)
        .get("/companies")
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(500);
  });

  /********************************* GET /companies with filter params */
  
  test("pass: passing in all valid search params", async function () {
    
    const resp = await request(app).get("/companies?name=2&minEmployees=1&maxEmployees=3");
    expect(resp.body).toEqual({
      companies: [{
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      }]
    });
  })
  

  test("pass: passing in some valid search params", async function () {
    
    const resp = await request(app).get("/companies?name=c&minEmployees=2");
    expect(resp.body).toEqual({
      companies: [{
          handle: "c3",
          name: "C3",
          description: "Desc3",
          numEmployees: 3,
          logoUrl: "http://c3.img",
      }]
    });
  })
  
  test("fails: passing in invalid search params: min greater than max", async function () {
    const resp = await request(app).get("/companies?name=c1&minEmployees=4&maxEmployees=2");
    expect(resp.body).toEqual({
      "error": {
        "message": "Invalid search!",
        "status": 400,
      }
    });
  })

  test("fails: passing in invalid search params: extra params", async function () {
    
    const resp = await request(app).get("/companies?invalidParams=taco");
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance is not allowed to have the additional property \"invalidParams\""
        ],
        "status": 400
      }
    });
  })

  test("fails: passing in invalid search params: name", async function () {
    
    const resp = await request(app).get("/companies?name=");
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.name does not meet minimum length of 1"
        ],
        "status": 400
      }
    });
  })

  test("fails: passing in invalid search params: minEmployees no value", async function () {
    
    const resp = await request(app).get("/companies?minEmployees=");
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.minEmployees is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  })

  test("fails: passing in invalid search params: maxEmployees no value", async function () {
    
    const resp = await request(app).get("/companies?maxEmployees=");
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.maxEmployees is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  })
  test("fails: passing in invalid search params: minEmployees non integer", async function () {
    
    const resp = await request(app).get("/companies?minEmployees=notanumber");
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.minEmployees is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  })
  test("fails: passing in invalid search params: maxEmployees non integer", async function () {
    
    const resp = await request(app).get("/companies?maxEmployees=notanumber");
    expect(resp.body).toEqual({
      "error": {
        "message": [
          "instance.maxEmployees is not of a type(s) integer"
        ],
        "status": 400
      }
    });
  })
});

/************************************** GET /companies/:handle */

describe("GET /companies/:handle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/companies/c1`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("works for anon: company w/o jobs", async function () {
    const resp = await request(app).get(`/companies/c2`);
    expect(resp.body).toEqual({
      company: {
        handle: "c2",
        name: "C2",
        description: "Desc2",
        numEmployees: 2,
        logoUrl: "http://c2.img",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/companies/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /companies/:handle */

describe("PATCH /companies/:handle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      company: {
        handle: "c1",
        name: "C1-new",
        description: "Desc1",
        numEmployees: 1,
        logoUrl: "http://c1.img",
      },
    });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        });
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if not admin", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          name: "C1-new",
        })
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
        .patch(`/companies/nope`)
        .send({
          name: "new nope",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          handle: "c1-new",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
        .patch(`/companies/c1`)
        .send({
          logoUrl: "not-a-url",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /companies/:handle */

describe("DELETE /companies/:handle", function () {
  
  test("works for admin", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for anon", async function () {
    const resp = await request(app)
        .delete(`/companies/c1`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth if not admin", async function () {
    const resp = await request(app)
          .delete(`/companies/c1`)
          .set('authorization', `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  })

  test("not found for no such company", async function () {
    const resp = await request(app)
        .delete(`/companies/nope`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
