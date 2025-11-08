# app.rb
require 'sinatra'
require 'json'
require 'firebase_id_token'
require 'redis'       # <-- New require
require 'mock_redis'  # <-- New require
require_relative 'parser'

# --- Firebase Auth Setup ---
FirebaseIdToken.configure do |config|
  config.project_ids = ['insurlytics-demo']
  # Use the official MockRedis gem. This 'tricks' the firebase gem
  # into thinking it has a real Redis server connection.
  config.redis = MockRedis.new
end

# --- Authentication Middleware ---
helpers do
  def protected!
    auth_header = request.env['HTTP_AUTHORIZATION']
    return halt 401, { error: 'No token provided' }.to_json unless auth_header

    token = auth_header.split(' ').last
    
    # Download Google's public keys (cached in our MockRedis)
    begin
       FirebaseIdToken::Certificates.request
    rescue => e
       # It's okay if this fails occasionally after the first time
    end

    begin
      decoded_token = FirebaseIdToken::Signature.verify(token)
      if decoded_token
        @user_uid = decoded_token['sub']
      else
        # If verify returns nil, it means verification failed
        halt 401, { error: "Token verification failed (Invalid Signature)" }.to_json
      end
    rescue => e
      # Catch specific errors from the gem
      halt 401, { error: "Verification Error: #{e.message}" }.to_json
    end
  end
end

# --- CORS Headers ---
before do
  headers['Access-Control-Allow-Origin'] = '*'
  headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
end

options '/parse' do
  200
end

# --- Secure Parsing Endpoint ---
post '/parse' do
  protected!
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
  
  parsed_data = parse_illustration_text(text)
  return parsed_data.to_json
end