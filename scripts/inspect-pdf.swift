// Local read-only source inspection. Generated page images/OCR belong in tmp/pdfs/.
import Foundation
import PDFKit
import AppKit
import Vision

guard CommandLine.arguments.count >= 3 else {
    fatalError("Usage: inspect-pdf input.pdf output-directory [page numbers or all]")
}
let source = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
guard let document = PDFDocument(url: source) else { fatalError("PDF open failed") }
print("Pages: \(document.pageCount)")
for index in 0..<document.pageCount {
    guard let page = document.page(at: index) else { continue }
    let snippet = (page.string ?? "").prefix(240).replacingOccurrences(of: "\n", with: " | ")
    print("Page \(index + 1): \(snippet)")
}
let arguments = Array(CommandLine.arguments.dropFirst(3))
let pages = arguments.contains("all") ? Array(1...document.pageCount) : arguments.compactMap { Int($0) }
if !pages.isEmpty { try FileManager.default.createDirectory(at: output, withIntermediateDirectories: true) }
for number in pages {
    guard number > 0, let page = document.page(at: number - 1) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    let width: CGFloat = 2000
    let image = page.thumbnail(of: NSSize(width: width, height: width * bounds.height / bounds.width), for: .mediaBox)
    guard let tiff = image.tiffRepresentation,
          let bitmap = NSBitmapImageRep(data: tiff),
          let cgImage = bitmap.cgImage,
          let png = bitmap.representation(using: .png, properties: [:]) else { fatalError("Image encoding failed") }
    let basename = String(format: "page-%02d", number)
    try png.write(to: output.appendingPathComponent(basename + ".png"), options: .atomic)
    if arguments.contains("--ocr") {
        do {
            let request = VNRecognizeTextRequest()
            request.recognitionLevel = .accurate
            request.recognitionLanguages = ["ko-KR", "en-US"]
            request.usesLanguageCorrection = false
            try VNImageRequestHandler(cgImage: cgImage, options: [:]).perform([request])
            let lines = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }
            let text = "PDF PAGE \(number) — OCR, verify against image\n" + lines.joined(separator: "\n")
            try text.write(to: output.appendingPathComponent(basename + ".txt"), atomically: true, encoding: .utf8)
        } catch { print("OCR unavailable for \(basename): \(error)") }
    }
    print("Rendered: \(basename)")
}
