# frozen_string_literal: true

require 'pdf-reader'
require 'json'

def parse_insurance_pdf(file_path)
  text = ""
  begin
    # Extracts the text from the PDF file
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
    total_premium: nil,
    yearly_data: []
  }

  if text.match?(/Accelerator 20/i)
    premium_match = text.match(/Total Premium - Annually\s+.*?\$?([\d,]+\.\d{2})/m)
    data[:total_premium] = premium_match[1].delete(',').to_f if premium_match

    # Simple regex for the Term Life table
    text.scan(/^\s*(\d{1,3})\s+\d{2,3}\s+[\d,.]+\s+([\d,]+)/m).each do |match|
      year, death_benefit = match
      data[:yearly_data] << {
        year: year.to_i,
        net_cash_value: 0, 
        net_death_benefit: death_benefit.delete(',').to_i
      }
    end

  elsif text.match?(/Limited Pay Whole Life/i)
    
    if text.match?(/Modal Additional Deposit PUA Rider/i)
      base_premium_match = text.match(/Contract Premium\s+.*?\$([\d,]+\.\d{2})/m)
      madpua_premium_match = text.match(/MADPUA Premium\s+.*?\$([\d,]+\.\d{2})/m)
      if base_premium_match && madpua_premium_match
        base = base_premium_match[1].delete(',').to_f * 12
        madpua = madpua_premium_match[1].delete(',').to_f * 12
        data[:total_premium] = (base + madpua).round(2)
      end
    else
      premium_match = text.match(/(?:Total Premium - Annually|Annualized\s+Contract Premium)\s+.*?\$?([\d,]+\.\d{2})/m)
      data[:total_premium] = premium_match[1].delete(',').to_f if premium_match
    end

    text.scan(/^\s*(\d{1,3})\s+\d{2,3}\s+.*?\s+([\d,]+)\s+([\d,]+)\s*$/m).each do |match|
        year, net_cash_value, net_death_benefit = match
        
        # This check ensures we only add rows that have valid numbers
        next if year.nil? || net_cash_value.nil? || net_death_benefit.nil?

        data[:yearly_data] << {
            year: year.to_i,
            net_cash_value: net_cash_value.delete(',').to_i,
            net_death_benefit: net_death_benefit.delete(',').to_i
        }
    end
  end

  return data
end

pdf_file = 'Blanchard, Robert - 100k 901 LPU 65 w madpu5.pdf'
parsed_data = parse_insurance_pdf(pdf_file)

# Print the results in a clean JSON format
puts JSON.pretty_generate(parsed_data) if parsed_data

# Blanchard, Robert - 1m 874
# Blanchard, Robert - 100k 901 LPU 65 w madpu5
# Blanchard, Robert - 100k 901 LPU 65
