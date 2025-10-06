require 'pdf-reader'

pdf_file = PDF::Reader.new('/pdf_test.pdf')

# insurance_data = {}

puts "this is a test. The pdf file has #{pdf_file.page_cout} pages"
