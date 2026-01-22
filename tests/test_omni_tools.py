import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import unittest
import io
import json
from modules.tools_native.processor import ToolProcessor, tool_processor

# Attempt to import dependencies for creating test artifacts
try:
    import pypdf
    from PIL import Image
    import pandas as pd
    DEPENDENCIES_AVAILABLE = True
except ImportError:
    DEPENDENCIES_AVAILABLE = False

@unittest.skipUnless(DEPENDENCIES_AVAILABLE, "Required libraries not installed")
class TestOmniTools(unittest.TestCase):
    
    def test_merge_pdfs(self):
        """Test PDF merging functionality."""
        def create_pdf(text):
            writer = pypdf.PdfWriter()
            page = writer.add_blank_page(width=72, height=72)
            output = io.BytesIO()
            writer.write(output)
            return output.getvalue()
            
        pdf1 = create_pdf("Page 1")
        pdf2 = create_pdf("Page 2")
        
        merged_bytes = tool_processor.merge_pdfs([pdf1, pdf2])
        
        # Verify result is a valid PDF and has 2 pages
        reader = pypdf.PdfReader(io.BytesIO(merged_bytes))
        self.assertEqual(len(reader.pages), 2)

    def test_split_pdf(self):
        """Test PDF splitting functionality."""
        # Create a 3-page PDF
        writer = pypdf.PdfWriter()
        for i in range(3):
            writer.add_blank_page(width=72, height=72)
        
        output = io.BytesIO()
        writer.write(output)
        pdf_content = output.getvalue()
        
        # Split into individual pages
        result = tool_processor.split_pdf(pdf_content)
        self.assertEqual(len(result), 3)
        
        # Verify each result is a valid single-page PDF
        for pdf_bytes in result:
            reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
            self.assertEqual(len(reader.pages), 1)

    def test_convert_image(self):
        """Test image conversion."""
        img = Image.new('RGB', (10, 10), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        input_data = img_bytes.getvalue()
        
        # Convert to JPEG
        output_bytes = tool_processor.convert_image(input_data, "JPEG")
        
        # Verify output
        out_img = Image.open(io.BytesIO(output_bytes))
        self.assertEqual(out_img.format, "JPEG")
        self.assertEqual(out_img.size, (10, 10))

    def test_resize_image(self):
        """Test image resizing."""
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        input_data = img_bytes.getvalue()
        
        # Resize to 50x50
        output_bytes = tool_processor.resize_image(input_data, 50, 50, maintain_aspect=False)
        
        # Verify output
        out_img = Image.open(io.BytesIO(output_bytes))
        self.assertEqual(out_img.size, (50, 50))

    def test_compress_image(self):
        """Test image compression."""
        img = Image.new('RGB', (100, 100), color='green')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        input_data = img_bytes.getvalue()
        
        # Compress
        output_bytes = tool_processor.compress_image(input_data, quality=50)
        
        # Verify output is JPEG (compression changes format)
        out_img = Image.open(io.BytesIO(output_bytes))
        self.assertEqual(out_img.format, "JPEG")

    def test_process_data_csv_to_json(self):
        """Test CSV to JSON conversion."""
        csv_content = b"col1,col2\nval1,val2\nval3,val4"
        
        # Process: CSV -> JSON
        result = tool_processor.process_data(csv_content, "test.csv", "to_json")
        data = json.loads(result)
        
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['col1'], 'val1')
        self.assertEqual(data[1]['col2'], 'val4')

    def test_text_transform(self):
        """Test text transformation tools."""
        text = "Hello World"
        
        # Uppercase
        result = tool_processor.transform_text(text, "uppercase")
        self.assertEqual(result, "HELLO WORLD")
        
        # Lowercase
        result = tool_processor.transform_text(text, "lowercase")
        self.assertEqual(result, "hello world")
        
        # Reverse
        result = tool_processor.transform_text(text, "reverse")
        self.assertEqual(result, "dlroW olleH")

    def test_math_calculate(self):
        """Test mathematical calculations."""
        result = tool_processor.calculate("2 + 2")
        self.assertEqual(result['result'], 4)
        
        result = tool_processor.calculate("10 * 5")
        self.assertEqual(result['result'], 50)

    def test_generate_primes(self):
        """Test prime number generation."""
        primes = tool_processor.generate_primes(20)
        expected = [2, 3, 5, 7, 11, 13, 17, 19]
        self.assertEqual(primes, expected)

if __name__ == '__main__':
    unittest.main()
