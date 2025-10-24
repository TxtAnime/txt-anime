// Quick test script for the mock API
const axios = require('axios');

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('🧪 Testing Mock API...\n');

    // Test health check
    console.log('1. Health check...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('✅ Health:', health.data);

    // Test create task
    console.log('\n2. Creating task...');
    const createResponse = await axios.post(`${API_BASE}/v1/tasks/`, {
      novel: 'This is a test novel about a brave hero who goes on an adventure to save the world from darkness.'
    });
    const taskId = createResponse.data.id;
    console.log('✅ Task created:', taskId);

    // Test get task
    console.log('\n3. Getting task details...');
    const taskResponse = await axios.get(`${API_BASE}/v1/tasks/${taskId}`);
    console.log('✅ Task details:', taskResponse.data);

    // Test get all tasks
    console.log('\n4. Getting all tasks...');
    const tasksResponse = await axios.get(`${API_BASE}/v1/tasks/`);
    console.log('✅ All tasks:', tasksResponse.data);

    console.log('\n⏳ Waiting 12 seconds for task to complete...');
    await new Promise(resolve => setTimeout(resolve, 12000));

    // Test get task after completion
    console.log('\n5. Getting task after completion...');
    const completedTaskResponse = await axios.get(`${API_BASE}/v1/tasks/${taskId}`);
    console.log('✅ Completed task:', completedTaskResponse.data);

    // Test get artifacts
    console.log('\n6. Getting task artifacts...');
    const artifactsResponse = await axios.get(`${API_BASE}/v1/tasks/${taskId}/artifacts`);
    console.log('✅ Artifacts:', {
      scenes: artifactsResponse.data.scenes.length,
      firstScene: {
        narration: artifactsResponse.data.scenes[0].narration,
        dialogues: artifactsResponse.data.scenes[0].dialogues.length
      }
    });

    console.log('\n🎉 All tests passed! Mock API is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Only run if axios is available
if (typeof require !== 'undefined') {
  try {
    testAPI();
  } catch (e) {
    console.log('⚠️  To run this test, install axios: npm install axios');
    console.log('Or test manually by visiting: http://localhost:5173');
  }
}