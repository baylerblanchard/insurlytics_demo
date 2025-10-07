require 'pdf-reader'

pdf_file = PDF::Reader.new('pdf_test.pdf')

# insurance_data = {}

puts "this is a test. The pdf file has #{pdf_file.page_count} pages"

string_to_find = 'rea' # The base string we are looking for
regex_to_find = /#{string_to_find}/i # A case-insensitive regular expression of that string

total_matches = 0

pdf_file.pages.each do |page|
  page_text = page.text

  # Use `scan` with the case-insensitive regex to find all occurrences.
  matches_on_page = page_text.scan(regex_to_find)

  puts "Found #{matches_on_page.count} matches on page #{page.number}" if matches_on_page.any?
  total_matches += matches_on_page.count
end

puts "\nTotal occurrences of '#{string_to_find}' found: #{total_matches}"
