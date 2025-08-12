export async function POST({ request }) {
  try {
    const formData = await request.formData();
    const data = {};
    
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    console.log('Form submission received:', data);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Form received successfully!',
      data: data,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}