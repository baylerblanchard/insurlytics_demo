require 'pdf-reader'
require 'json'

# A helper to safely convert currency strings to floats.
def to_currency(str)
  str.to_s.delete(',').to_f
end

# Extracts the main data table text from the full PDF text.
def extract_detail_text(full_text)
  # Use a case statement for clarity and easy extension.
  case full_text
  when /ILLUSTRATION ASSUMPTIONS:/i
    full_text.split(/ILLUSTRATION ASSUMPTIONS:/i, 2).last
  when /Policy Detail/i
    full_text.split(/Policy Detail/i, 2).last
  else
    full_text
  end
end

# --- Parser Implementations ---

def parse_accelerator_20(detail_text)
  yearly_data = []
  cumulative_premium = 0.0

  # Using named captures for readability
  regex = /^\s*\d{1,3}\s+(?<age>\d{2,3})\s+(?<premium>[\d,.]+)\s+(?<death_benefit>[\d,]+)/m

  detail_text.scan(regex).each do |match|
    # `match` is now a hash-like object with named captures
    current_premium = to_currency(match[:premium])
    cumulative_premium += current_premium
    yearly_data << {
      age: match[:age].to_i,
      annual_premium: current_premium.round(2),
      cumulative_premium: cumulative_premium.round(2),
      net_cash_value: 0,
      net_death_benefit: to_currency(match[:death_benefit]).to_i
    }
  end
  yearly_data
end

def parse_limited_pay_whole_life(detail_text)
  yearly_data = []
  cumulative_premium = 0.0

  # Using the 'x' flag for a more readable, commented regex.
  regex = /
    ^\s*                  # Start of line
    \d{1,3}\s+            # Policy Year
    (?<age>\d{2,3})\s+    # Age (captured)
    (?<premium>(?:[\d,.]+|Paid\sUp))\s+ # Premium or "Paid Up" (captured)
    .*?                   # Non-greedy match for anything in between
    \s+
    (?<cash_value>[\d,]+)\s+ # Net Cash Value (captured)
    (?<death_benefit>[\d,]+)\s* # Net Death Benefit (captured)
    $                     # End of line
  /mx

  detail_text.scan(regex).each do |match|
    current_premium = match[:premium].match?(/Paid Up/i) ? 0.0 : to_currency(match[:premium])
    cumulative_premium += current_premium
    yearly_data << {
      age: match[:age].to_i,
      annual_premium: current_premium.round(2),
      cumulative_premium: cumulative_premium.round(2),
      net_cash_value: to_currency(match[:cash_value]).to_i,
      net_death_benefit: to_currency(match[:death_benefit]).to_i
    }
  end
  yearly_data
end

# --- Main Dispatcher ---

def parse_illustration_text(text)
  detail_text = extract_detail_text(text)
  yearly_data = []

  # This structure is much easier to extend with new parsers.
  if text.match?(/Accelerator 20/i)
    yearly_data = parse_accelerator_20(detail_text)
  elsif text.match?(/Limited Pay Whole Life/i)
    yearly_data = parse_limited_pay_whole_life(detail_text)
  else
    # Optional: Log or handle unknown formats
    puts "Warning: Unknown document format. Could not parse yearly data."
    puts "Snippet: #{text[0..200].gsub("\n", " ")}..."
  end

  { yearly_data: yearly_data }
end