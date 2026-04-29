using System;
using System.IO;
using System.Text;

class Program {
    static void Main() {
        string path = @"dotnet\APEX.WebAPI\wwwroot\index.html";
        string text = File.ReadAllText(path, Encoding.UTF8);

        // Remove powershell garbled characters if present
        text = text.Replace("\0", "");
        
        // Fix double utf-8 encoded strings
        text = text.Replace("Ã©", "é")
                   .Replace("Ã¨", "è")
                   .Replace("Ã¢", "â")
                   .Replace("Ãª", "ê")
                   .Replace("Ã®", "î")
                   .Replace("Ã´", "ô")
                   .Replace("Ã»", "û")
                   .Replace("Ã§", "ç")
                   .Replace("Ã ", "à")
                   .Replace("Ã¹", "ù")
                   .Replace("â€”", "—")
                   .Replace("â€“", "–")
                   .Replace("â€œ", """)
                   .Replace("â€\?", """)
                   .Replace("â€™", "'")
                   .Replace("â€¦", "...")
                   .Replace("Ã‰", "É")
                   .Replace("Ã€", "À")
                   .Replace("Ã?", "ï")
                   .Replace("Å“", "œ")
                   .Replace("Ã¯", "ï");

        // Overwrite the file with clean UTF-8
        File.WriteAllText(path, text, new UTF8Encoding(false));
        Console.WriteLine("Done.");
    }
}
