require 'json'

def parse_insurance_illustration(text)
  data = {
    total_premium: nil,
    yearly_data: []
  }

  # --- 1. Calculate Total Premium ---
  # For the Whole Life policies with MADPUA rider
  if text.match?(/Modal Additional Deposit PUA Rider/)
    # Extracts the base contract premium and the MADPUA rider premium
    base_premium_match = text.match(/Contract Premium\s+.*?\$([\d,]+\.\d{2})/)
    madpua_premium_match = text.match(/MADPUA Premium\s+.*?\$([\d,]+\.\d{2})/)
    
    if base_premium_match && madpua_premium_match
      base_premium = base_premium_match[1].delete(',').to_f
      madpua_premium = madpua_premium_match[1].delete(',').to_f
      # The annualized contract premium is monthly * 12
      total_premium = (base_premium * 12) + (madpua_premium * 12)
      data[:total_premium] = total_premium.round(2)
    end
  else # For the Term and regular Whole Life policies
    # Looks for "Total Premium - Annually" or "Annualized Contract Premium"
    premium_match = text.match(/(?:Total Premium - Annually|Annualized\s+Contract Premium)\s+.*?\$?([\d,]+\.\d{2})/)
    if premium_match
      data[:total_premium] = premium_match[1].delete(',').to_f
    end
  end


  # --- 2. Extract Yearly Non-Guaranteed Cash Value and Death Benefit ---
  # This regex is designed to find the main data table in the whole life illustrations.
  # It looks for rows starting with a year number, followed by several money-like values.
  # It specifically captures the last two values in the row, which correspond to
  # "Net Cash Value" and "Net Death Benefit" under the non-guaranteed columns.
  text.scan(/^\s*"?(\d{1,2})\s*","\d{2,3}.*?,,.*?([\d,]+)\s*.*?,,.*?([\d,]+)\s*",/m).each do |match|
    year, net_cash_value, net_death_benefit = match

    data[:yearly_data] << {
      year: year.to_i,
      net_cash_value: net_cash_value.delete(',').to_i,
      net_death_benefit: net_death_benefit.delete(',').to_i
    }
  end
  
  # If the first regex found nothing (for the Term policy, which has no cash value)
  # we fall back to a simpler regex for just the death benefit.
  if data[:yearly_data].empty?
     text.scan(/^\s*"?(\d{1,2})\s*","\d{2,3}.*?([\d,]+)\s*","[\d,]+\s*",/m).each do |match|
        year, death_benefit = match
        data[:yearly_data] << {
          year: year.to_i,
          net_cash_value: 0, # Term policies have no cash value
          net_death_benefit: death_benefit.delete(',').to_i
        }
     end
  end


  return data
end

# Assume 'file_content' is a string variable holding the full text
# from "Blanchard, Robert - 100k 901 LPU 65 w madpu5.pdf"

file_content = File.read('Blanchard, Robert - 100k 901 LPU 65 w madpu5.pdf.txt') # Example of reading from a text file

parsed_data = parse_insurance_illustration(file_content)

# Pretty print the JSON output
puts JSON.pretty_generate(parsed_data)

