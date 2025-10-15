# frozen_string_literal: true

require 'pdf-reader'
require 'json'

def parse_insurance_pdf(file_path)
  text = ""
  begin
    reader = PDF::Reader.new(file_path)
    reader.pages.each do |page|
      text += page.text + "\n"
    end
  rescue => e
    puts "Error reading PDF file: #{e.message}"
    return nil
  end

  parse_illustration_text(text)
end

def parse_illustration_text(text)
  data = {
    # The top-level total_premium has been removed for clarity
    yearly_data: []
  }
  
  # This variable will track the running total of premiums paid
  cumulative_premium = 0.0

  # --- LOGIC TO DETECT POLICY TYPE AND PARSE ACCORDINGLY ---

  # 1. Logic for "Accelerator 20" Term Life Policy
  if text.match?(/Accelerator 20/i)
    # Regex updated to capture Age, Annual Premium, and Death Benefit
    text.scan(/^\s*\d{1,3}\s+(\d{2,3})\s+([\d,.]+)\s+([\d,]+)/m).each do |match|
      age_str, premium_str, death_benefit_str = match
      
      current_premium = premium_str.delete(',').to_f
      cumulative_premium += current_premium

      data[:yearly_data] << {
        age: age_str.to_i,
        cumulative_premium: cumulative_premium.round(2),
        net_cash_value: 0, # Term policies have no cash value
        net_death_benefit: death_benefit_str.delete(',').to_i
      }
    end

  # 2. Logic for "Limited Pay Whole Life" Policies
  elsif text.match?(/Limited Pay Whole Life/i)
    # Regex updated to capture Age, Annual Premium, and the final two value columns
    text.scan(/^\s*\d{1,3}\s+(\d{2,3})\s+((?:[\d,.]+|Paid Up))\s+.*?\s+([\d,]+)\s+([\d,]+)\s*$/m).each do |match|
        age_str, premium_str, net_cash_value_str, net_death_benefit_str = match
        
        # This handles the "Paid Up" status, where the premium is $0
        current_premium = premium_str.match?(/Paid Up/i) ? 0.0 : premium_str.delete(',').to_f
        cumulative_premium += current_premium

        data[:yearly_data] << {
            age: age_str.to_i,
            cumulative_premium: cumulative_premium.round(2),
            net_cash_value: net_cash_value_str.delete(',').to_i,
            net_death_benefit: net_death_benefit_str.delete(',').to_i
        }
    end
  end

  return data
end

# --- EXAMPLE USAGE ---
# This will work with any of the three PDF files.
# Let's use the first Whole Life policy as an example.
pdf_file = 'Blanchard, Robert - 100k 901 LPU 65.pdf'
parsed_data = parse_insurance_pdf(pdf_file)

# Print the results in a clean JSON format
puts JSON.pretty_generate(parsed_data) if parsed_data

# Blanchard, Robert - 1m 874
# Blanchard, Robert - 100k 901 LPU 65 w madpu5
# Blanchard, Robert - 100k 901 LPU 65
