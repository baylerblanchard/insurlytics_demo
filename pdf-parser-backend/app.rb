require 'sinatra'
require 'json'
require 'firebase/admin' # For Auth
require_relative 'parser'

# --- Firebase Admin Setup ---
# !! Make sure you have your 'serviceAccountKey.json' file in this folder
# !! Replace 'your-project-id' with your actual Firebase Project ID
Firebase::Admin.configure do |config|
  config.project_id = 'your-project-id' 
  config.credentials = Firebase::Admin::Credentials
    .from_service_account_json(File.join(__dir__, 'serviceAccountKey.json'))
end

# --- Authentication Middleware ---
helpers do
  def protected!
    auth_header = request.env['HTTP_AUTHORIZATION']
    return halt(401, 'No token provided') unless auth_header

    token = auth_header.split(' ').last
    return halt(401, 'Invalid token') unless token

    begin
      # Verify the token with Firebase
      decoded_token = Firebase::Admin::Auth.verify_id_token(token)
      @user_uid = decoded_token[:uid]
    rescue => e
      halt(401, "Token verification failed: #{e.message}")
    end
  end
end

# --- CORS Headers ---
before do
  # Allow requests from your React app
  allowed_origins = ['http://localhost:5000', 'http://localhost:3000']
  
  origin = request.env['HTTP_ORIGIN']
  if allowed_origins.include?(origin)
     headers['Access-Control-Allow-Origin'] = origin
  end
  
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization' # Add Authorization
end

# Handle the browser's pre-flight "OPTIONS" request
options '/parse' do
  200
end

# --- Secure Parsing Endpoint ---
post '/parse' do
  protected! # This line ensures only logged-in users can run this
  
  content_type :json
  
  if !params[:file] || !params[:file][:tempfile]
    halt(400, { error: 'No file uploaded' }.to_json)
  end

  tempfile = params[:file][:tempfile]
  text = ""
  begin
    reader = PDF::Reader.new(tempfile)
    reader.pages.each do |page|
      text += page.text + "\n"
    end
  rescue => e
    halt(500, { error: "Error reading PDF: #{e.message}" }.to_json)
  end
  
  # Run your parsing logic
  parsed_data = parse_illustration_text(text)
  
  return parsed_data.to_json
end