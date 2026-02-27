import { expect } from 'chai';
import sinon from 'sinon';
import { updateProfile } from '../src/controllers/auth.js';

describe('Auth Controller - updateProfile', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: { id: 'testUserId' },
      body: {
        displayName: 'Test User',
        bio: 'Test Bio'
      },
      file: undefined
    };
    res = {
      status: sinon.stub().returnsThis(),
      json: sinon.spy()
    };
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return 400 when socialLinks is invalid JSON', async () => {
    req.body.socialLinks = '{invalidJson}';

    await updateProfile(req, res, next);

    expect(next.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({
      success: false,
      message: 'Invalid JSON format in socialLinks or specialties'
    })).to.be.true;
  });

  it('should return 400 when specialties is invalid JSON', async () => {
    req.body.specialties = '{invalidJson}';

    await updateProfile(req, res, next);

    expect(next.called).to.be.false;
    expect(res.status.calledWith(400)).to.be.true;
    expect(res.json.calledWith({
      success: false,
      message: 'Invalid JSON format in socialLinks or specialties'
    })).to.be.true;
  });
});
