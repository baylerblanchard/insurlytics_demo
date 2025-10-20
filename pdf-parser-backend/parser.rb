# parser.rb
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
    yearly_data: []
  }
  
  cumulative_premium = 0.0
  
  # --- NEW LOGIC TO ISOLATE THE DETAIL TABLE ---
  # We find the unique header that marks the *start* of the main data tables
  # and discard everything before it (like the summary page).
  detail_text = ""
  if text.match?(/ILLUSTRATION ASSUMPTIONS:/i)
    # For Whole Life policies, the table starts after this header
    split_text = text.split(/ILLUSTRATION ASSUMPTIONS:/i, 2)
    detail_text = split_text.length > 1 ? split_text[1] : ""
  elsif text.match?(/Policy Detail/i)
    # For Term Life policies, the table starts after this header
    split_text = text.split(/Policy Detail/i, 2)
    detail_text = split_text.length > 1 ? split_text[1] : ""
  else
    # Fallback in case headers are not found
    detail_text = text
  end

  # --- LOGIC TO DETECT POLICY TYPE AND PARSE ACCORDINGLY ---
  # We still use the full 'text' to identify the policy type,
  # but we use 'detail_text' to parse the data rows.

  # 1. Logic for "Accelerator 20" Term Life Policy
  if text.match?(/Accelerator 20/i)
    # Regex for Term: Captures Age, Annual Premium, and Death Benefit
    detail_text.scan(/^\s*\d{1,3}\s+(\d{2,3})\s+([\d,.]+)\s+([\d,]+)/m).each do |match|
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
    # Regex for Whole Life: Captures Age, Annual Premium, Net Cash Value, and Net Death Benefit
    detail_text.scan(/^\s*\d{1,3}\s+(\d{2,3})\s+((?:[\d,.]+|Paid Up))\s+.*?\s+([\d,]+)\s+([\d,]+)\s*$/m).each do |match|
        age_str, premium_str, net_cash_value_str, net_death_benefit_str = match
        
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