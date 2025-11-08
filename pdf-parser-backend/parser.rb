require 'pdf-reader'
require 'json'

def parse_illustration_text(text)
  data = { yearly_data: [] }
  cumulative_premium = 0.0
  detail_text = ""

  if text.match?(/ILLUSTRATION ASSUMPTIONS:/i)
    split_text = text.split(/ILLUSTRATION ASSUMPTIONS:/i, 2)
    detail_text = split_text.length > 1 ? split_text[1] : ""
  elsif text.match?(/Policy Detail/i)
    split_text = text.split(/Policy Detail/i, 2)
    detail_text = split_text.length > 1 ? split_text[1] : ""
  else
    detail_text = text
  end

  if text.match?(/Accelerator 20/i)
    detail_text.scan(/^\s*\d{1,3}\s+(\d{2,3})\s+([\d,.]+)\s+([\d,]+)/m).each do |match|
      age_str, premium_str, death_benefit_str = match
      current_premium = premium_str.delete(',').to_f
      cumulative_premium += current_premium
      data[:yearly_data] << {
        age: age_str.to_i,
        annual_premium: current_premium.round(2), # <-- CRITICAL NEW LINE
        cumulative_premium: cumulative_premium.round(2),
        net_cash_value: 0,
        net_death_benefit: death_benefit_str.delete(',').to_i
      }
    end
  elsif text.match?(/Limited Pay Whole Life/i)
    detail_text.scan(/^\s*\d{1,3}\s+(\d{2,3})\s+((?:[\d,.]+|Paid Up))\s+.*?\s+([\d,]+)\s+([\d,]+)\s*$/m).each do |match|
        age_str, premium_str, net_cash_value_str, net_death_benefit_str = match
        current_premium = premium_str.match?(/Paid Up/i) ? 0.0 : premium_str.delete(',').to_f
        cumulative_premium += current_premium
        data[:yearly_data] << {
            age: age_str.to_i,
            annual_premium: current_premium.round(2), # <-- CRITICAL NEW LINE
            cumulative_premium: cumulative_premium.round(2),
            net_cash_value: net_cash_value_str.delete(',').to_i,
            net_death_benefit: net_death_benefit_str.delete(',').to_i
        }
    end
  end

  return data
end