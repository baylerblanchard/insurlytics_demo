require 'sinatra'
require 'json'
require 'firebase_id_token'
require_relative 'parser'

# --- Firebase Auth Setup (no Redis required) ---
FirebaseIdToken.configure do |config|
  config.project_ids = ['insurlytics-demo']
  config.redis = nil  # ✅ disables Redis, stores keys in memory
end

# --- Authentication Middleware ---
helpers do
  def protected!
    auth_header = request.env['HTTP_AUTHORIZATION']
    return halt 401, { error: 'No token provided' }.to_json unless auth_header

    token = auth_header.split(' ').last

    begin
      FirebaseIdToken::Certificates.request
      payload = FirebaseIdToken::Signature.verify(token)
      if payload
        @user_uid = payload['user_id']
        puts "✅ Authenticated Firebase UID: #{@user_uid}"
      else
        halt 401, { error: 'Invalid Firebase token' }.to_json
      end
    rescue => e
      halt 401, { error: "Token verification failed: #{e.message}" }.to_json
    end
  end
end

# --- CORS Headers ---
before do
  allowed_origins = ['http://localhost:5000', 'http://localhost:3000']
  origin = request.env['HTTP_ORIGIN']
  if allowed_origins.include?(origin)
    headers['Access-Control-Allow-Origin'] = origin
  end
  headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
end

# Handle the browser's pre-flight "OPTIONS" request
options '/parse' do
  200
end

# --- Secure Parsing Endpoint ---
post '/parse' do
  protected!  # ✅ Auth required

  content_type :json

  unless params[:file] && params[:file][:tempfile]
    halt 400, { error: 'No file uploaded' }.to_json
  end

  tempfile = params[:file][:tempfile]
  text = ""

  begin
    reader = PDF::Reader.new(tempfile)
    reader.pages.each do |page|
      text += page.text + "\n"
    end
  rescue => e
    halt 500, { error: "Error reading PDF: #{e.message}" }.to_json
  end

  parsed_data = parse_illustration_text(text)
  parsed_data.to_json
end
