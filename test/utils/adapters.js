const adapters = {
  message: {
    api: {
      post: async (method, params) => {
        return new Promise(resolve => {
          let r = null;
          if (['channels.invite', 'groups.invite'].includes(method)) {
            r = { method, params };
          } else if (method === 'users.create') {
            r = { user: { _id: 321 } };
          }
          resolve(r);
        });
      },
      get: async (method, params) => {
        return new Promise(resolve => {
          let r = null;
          if (method === 'users.info') {
            if (params.userId === 1) {
              r = { user: { id: params.userId, username: 'test', roles: [] } };
            } else if (params.userId === 2) {
              r = {
                user: { id: params.userId, username: 'test2', roles: ['test'] }
              };
            }
          } else if (
            method === 'groups.members' ||
            method === 'channels.members'
          ) {
            r = { count: 1, members: [{ _id: 1, _id: 2 }] };
          } else if (method === 'groups.info') {
            if (params.roomName === 'test') {
              r = { group: { _id: 1, t: 'c' } };
            } else if (params.roomName === 'test_private') {
              r = { group: { _id: 2, t: 'p' } };
            }
          } else if (method === 'users.list') {
            if ('username' in params.query) {
              r = {
                count: 1,
                users: [
                  {
                    _id: 1,
                    name: 'Test 1',
                    username: `test1`,
                    emails: [{ addresses: 'test1@email' }]
                  }
                ]
              };
            } else if ('_id' in params.query) {
              let ids = [];
              if (
                typeof params.query._id === 'object' &&
                '$in' in params.query._id
              ) {
                ids = params.query._id['$in'];
              } else if (typeof params.query._id !== 'object') {
                ids = [params.query._id];
              }
              r = {
                count: ids.length,
                users: ids.map(iid => ({
                  _id: iid,
                  username: `test${iid}`,
                  name: `Test ${iid}`,
                  emails: [{ addresses: `test${iid}@email` }]
                }))
              };
            } else if (
              'emails.address' in params.query &&
              params.query['emails.address'] === 'user@email'
            ) {
              r = {
                count: 1,
                users: [{ _id: 1, name: 'Test', username: 'test1' }]
              };
            } else {
              r = { count: 0, users: [] };
            }
          }
          resolve(r);
        });
      }
    }
  }
};

module.exports = adapters;
