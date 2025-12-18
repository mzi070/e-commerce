const http = require('http');

// Test registration
const registerData = JSON.stringify({
  email: 'customer@test.com',
  password: 'password123',
  name: 'Test Customer'
});

const registerOptions = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': registerData.length
  }
};

console.log('Testing Registration Endpoint...\n');

const registerReq = http.request(registerOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', JSON.parse(data));
    
    if (res.statusCode === 201) {
      const response = JSON.parse(data);
      const token = response.token;
      
      // Test protected route with token
      console.log('\n\nTesting Protected Profile Endpoint...\n');
      
      const profileOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/auth/profile',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      const profileReq = http.request(profileOptions, (profileRes) => {
        let profileData = '';
        
        profileRes.on('data', (chunk) => {
          profileData += chunk;
        });
        
        profileRes.on('end', () => {
          console.log('Status Code:', profileRes.statusCode);
          console.log('Response:', JSON.parse(profileData));
          
          // Test login
          console.log('\n\nTesting Login Endpoint...\n');
          
          const loginData = JSON.stringify({
            email: 'customer@test.com',
            password: 'password123'
          });
          
          const loginOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': loginData.length
            }
          };
          
          const loginReq = http.request(loginOptions, (loginRes) => {
            let loginResData = '';
            
            loginRes.on('data', (chunk) => {
              loginResData += chunk;
            });
            
            loginRes.on('end', () => {
              console.log('Status Code:', loginRes.statusCode);
              console.log('Response:', JSON.parse(loginResData));
              
              console.log('\n\n✅ All authentication tests completed!');
              process.exit(0);
            });
          });
          
          loginReq.on('error', (e) => {
            console.error(`Problem with login request: ${e.message}`);
            process.exit(1);
          });
          
          loginReq.write(loginData);
          loginReq.end();
        });
      });
      
      profileReq.on('error', (e) => {
        console.error(`Problem with profile request: ${e.message}`);
        process.exit(1);
      });
      
      profileReq.end();
    }
  });
});

registerReq.on('error', (e) => {
  console.error(`Problem with registration request: ${e.message}`);
  console.error('\nMake sure the backend server is running on port 3000');
  process.exit(1);
});

registerReq.write(registerData);
registerReq.end();
