# app.rb
require 'sinatra'
require 'json'
require_relative 'parser' # Loads your parser.rb file

# --- IMPORTANT: CORS ---
# This tells your backend server to accept requests from your
# frontend server (which will be at http://localhost:5000).
# Without this, the browser will block the request.
before do
  # Using * is fine for local testing
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
