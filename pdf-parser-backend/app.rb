# app.rb
require 'sinatra'
require 'json'
require 'google-id-token' # <-- This is the new, correct gem
require_relative 'parser'

# --- Authentication Middleware ---
helpers do
  def protected!
    auth_header = request.env['HTTP_AUTHORIZATION']
    return halt 401, { error: 'No token provided' }.to_json unless auth_header

    token = auth_header.split(' ').last
    validator = GoogleIDToken::Validator.new

    # --- THE FIX IS HERE ---
    # Use your Project ID, exactly as shown in the debug output "aud" field
    aud = 'insurlytics-demo' 
    # -----------------------

    begin
      payload = validator.check(token, aud)
      @user_uid = payload['sub']
    rescue GoogleIDToken::ValidationError => e
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
  # Make sure to allow the 'Authorization' header
  headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
end

# Handle the browser's pre-flight "OPTIONS" request
options '/parse' do
  200
end

# --- Secure Parsing Endpoint ---
post '/parse' do
  protected! # This line locks the route
  
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