# app.rb
require 'sinatra'
require 'json'
require 'firebase/admin'
require_relative 'parser' # Loads your parser.rb file

# --- Firebase Admin Setup ---
# Initialize the Firebase Admin SDK
Firebase::Admin.configure do |config|
  config.project_id = 'your-project-id' # Find in your Firebase console
  config.credentials = Firebase::Admin::Credentials
    .from_service_account_json(File.join(__dir__, 'serviceAccountKey.json'))
end

# --- Authentication Middleware ---
# This "helper" function will run before any protected route.
# It checks for a token and verifies it with Firebase.
helpers do
  def protected!
    auth_header = request.env['HTTP_AUTHORIZATION']
    return halt(401, 'No token provided') unless auth_header

    token = auth_header.split(' ').last
    return halt(401, 'Invalid token') unless token

    begin
      # This is the magic line: it asks Firebase if the token is real
      decoded_token = Firebase::Admin::Auth.verify_id_token(token)
      # Make the user's info available to the route
      @user_uid = decoded_token[:uid]
    rescue => e
      halt(401, "Token verification failed: #{e.message}")
    end
  end
end

# --- CORS Headers (No Change) ---
before do
  # ... (your existing CORS logic) ...
end

# --- THIS IS YOUR NEW, SECURE ENDPOINT ---
post '/parse' do
  protected! # <-- This line locks the route!

  # If we get here, the user is authenticated.
  # @user_uid is available if you want to use it (e.g., save their parse)

  content_type :json
  tempfile = params[:file][:tempfile]
  text = ""
  # ... (rest of your parsing logic) ...
end


# --- IMPORTANT: CORS ---
# This tells your backend server to accept requests from your
# frontend server (which will be at http://localhost:5000).
# Without this, the browser will block the request.
before do
  # Using * is fine for local testing
  allowed_origins = ['http://localhost:5000', 'http://localhost:3000']

  origin = request.env['HTTP_ORIGIN']
  if allowed_origins.include?(origin)
    headers['Access-Control-Allow-Origin'] = origin
  end

  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type'
end

# This handles the browser's "pre-flight" check
options '/parse' do
  200
end

# This is our main API endpoint
post '/parse' do
  content_type :json

  # Get the uploaded file
  tempfile = params[:file][:tempfile]

  # Read the PDF text
  text = ''
  begin
    reader = PDF::Reader.new(tempfile)
    reader.pages.each do |page|
      text += page.text + "\n"
    end
  rescue => e
    status 500
    return { error: "Error reading PDF: #{e.message}" }.to_json
  end

  # Run your parsing logic
  parsed_data = parse_illustration_text(text)

  # Send the JSON back to the browser
  return parsed_data.to_json
end
