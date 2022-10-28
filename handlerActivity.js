import { db } from './mysql.config.js';
import { BadRequestResponse, CreatedResponse, NotFoundResponse, OkResponse } from './respons.js';
import { cache } from './caching.js';

const caching = cache;

const getActivity = async (request, response) => {
    const key = 'activities';
    let reply = caching.get(key);
    if (!reply) {
        reply = await db.select('id', 'title', 'email').from('activities').limit(20);
        caching.set(key, reply);
    }
    return OkResponse(response, reply);
};

const getOneActivity = async (request, response) => {
    const { id } = request.path_parameters;
    const key = `activities-${id}`;
    let reply = caching.get(key);
    if (!reply) {
        reply = await db.select('id', 'title', 'email', 'created_at').from('activities').where({ id }).first();
        if (!reply) {
            return NotFoundResponse(response, `Activity with ID ${id} Not Found`);
        }
        caching.set(key, reply);
    }
    return OkResponse(response, reply);
};

const createActivity = async (request, response) => {
    const { title = null, email = null } = await request.json();
    if (!email) {
        return BadRequestResponse(response, 'email cannot be null');
    }
    if (!title) {
        return BadRequestResponse(response, 'title cannot be null');
    }
    const [id] = await db('activities').insert({ email, title });
    const result = {
        id,
        title,
        email,
    };
    caching.set(`activities-${id}`, result);
    caching.del('activities');
    return CreatedResponse(response, result);
};

const updateActivity = async (request, response) => {
    const { id } = request.path_parameters;
    const data = await request.json();
    await db('activities').where({ id }).update({ ...data });
    const result = await db.select('id', 'title', 'email').from('activities').where({ id }).first();
    if (!result) {
        return NotFoundResponse(response, `Activity with ID ${id} Not Found`);
    }
    caching.set(`activities-${id}`, result);
    caching.del('activities');
    return OkResponse(response, result);
};

const deleteActivity = async (request, response) => {
    const { id } = request.path_parameters;
    const result = await db('activities').where({ id }).delete();
    if (!result) {
        return NotFoundResponse(response, `Activity with ID ${id} Not Found`);
    }
    caching.del(`activities-${id}`);
    caching.del('activities');
    return OkResponse(response, {});
};

export { getActivity, getOneActivity, createActivity, updateActivity, deleteActivity };