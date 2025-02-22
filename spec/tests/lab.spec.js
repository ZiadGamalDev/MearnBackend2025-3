const { clearDatabase } = require('../../db.connection');
const request = require('supertest');
const app = require('../..');
const req = request(app);

describe('Lab Testing:', () => {
  describe('Users Routes:', () => {
    beforeAll(async () => {
      fakeUserOne = {
        name: 'Ziad Gamal',
        email: 'ziad@example.com',
        password: 'SecurePass123',
      };
      await req.post('/user/signup').send(fakeUserOne);
      let loginRes = await req.post('/user/login').send(fakeUserOne);
      userToken = loginRes.body.data;

      fakeUserTwo = {
        name: 'Omar Al-Khalil',
        email: 'omar@example.com',
        password: 'AnotherPass456',
      };
      await req.post('/user/signup').send(fakeUserTwo);
      let loginRes2 = await req.post('/user/login').send(fakeUserTwo);
      userToken2 = loginRes2.body.data;

      fakeTask = {
        title: 'Complete API Testing',
        description: 'Ensure all endpoints return expected responses.',
      };
      let taskRes = await req
        .post('/todo')
        .send(fakeTask)
        .set({ authorization: userToken });
      todoId = taskRes.body.data._id;
    });

    // Note: User name must be sent in req query, not req params
    it(`Request to GET (/user/search) - 
        Expect to retrieve the correct user by name`, async () => {
      let res = await req.get('/user/search').query({ name: fakeUserOne.name });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe(fakeUserOne.name);
    });

    it(`Request to GET (/user/search) with invalid name - 
        Expect correct response status and message`, async () => {
      let res = await req.get('/user/search').query({ name: 'Ali Ibn Musa' });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe(
        'There is no user with name: Ali Ibn Musa'
      );
    });
  });

  // ----------------------------------------------------------------------------------------

  describe('Todos Routes:', () => {
    it(`Request to PATCH (/todo/:id) with only ID - 
        Expect correct response status and error message`, async () => {
      let res = await req.patch(`/todo/${todoId}`).set({
        authorization: userToken,
      });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Must provide title and ID to edit todo');
    });

    it(`Request to PATCH (/todo/:id) with ID and new title - 
        Expect success response and updated todo`, async () => {
      let res = await req
        .patch(`/todo/${todoId}`)
        .send({ title: 'Finalize API Testing' })
        .set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Finalize API Testing');
    });

    it(`Request to GET (/todo/user) - 
        Expect to retrieve all todos for the authenticated user`, async () => {
      let res = await req.get('/todo/user').set({ authorization: userToken });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveSize(1);
    });

    it(`Request to GET (/todo/user) for a user with no todos - 
        Expect appropriate response message`, async () => {
      let res = await req.get('/todo/user').set({ authorization: userToken2 });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("Couldn't find any todos for ");
    });
  });

  afterAll(async () => {
    await clearDatabase();
  });
});
