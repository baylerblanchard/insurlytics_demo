require 'pdf-reader'

pdf_file = PDF::Reader.new('pdf_test.pdf')

# insurance_data = {}

puts "this is a test. The pdf file has #{pdf_file.page_count} pages"

string_to_find = 'rea'

pdf_file.pages.each do |page|
  page_text = page.text

  match_data = page_text.match(string_to_find)

  puts match_data
end
