$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("d:\AU Academics\3'1 IMP Docs\FatigueX\PRD_Ergonomic_Digital_Twin_Live_AR_Mobile.docx")
$doc.Content.Text | Out-File -FilePath "d:\AU Academics\3'1 IMP Docs\FatigueX\PRD_text.txt" -Encoding UTF8
$doc.Close()
$word.Quit()
