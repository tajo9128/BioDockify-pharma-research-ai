/**
 * LaTeX Generator Tool
 *
 * Generates LaTeX documents for academic papers and theses.
 */

import { BaseTool, ToolConfig, ToolInput, ToolOutput } from './base'

interface Chapter {
  number: number
  title: string
  sections: Section[]
}

interface Section {
  title: string
  content: string
  subsections?: Section[]
}

interface LatexDocument {
  title: string
  author: string
  date: string
  abstract: string
  chapters: Chapter[]
  bibliography: any[]
}

export class LaTeXGeneratorTool extends BaseTool {
  public readonly config: ToolConfig = {
    name: 'latex_generator',
    description: 'Generate LaTeX documents for academic papers and theses',
    category: 'export',
    version: '1.0.0',
    requiredParams: ['title', 'content'] || ['document'],
    optionalParams: ['author', 'chapters', 'bibliography', 'template']
  }

  async execute(input: ToolInput): Promise<ToolOutput> {
    try {
      const {
        title,
        author = 'Author Name',
        date = new Date().toISOString().split('T')[0],
        content,
        chapters,
        bibliography,
        template = 'article'
      } = input

      // Build LaTeX document
      const latexDoc: LatexDocument = {
        title: title as string,
        author: author as string,
        date: date as string,
        abstract: content as string || '',
        chapters: chapters as Chapter[] || [],
        bibliography: bibliography as any[] || []
      }

      // Generate LaTeX code
      const latexCode = this.generateLatex(latexDoc, template as string)

      return this.success({
        latex: latexCode,
        filename: `${title.replace(/\s+/g, '_').toLowerCase()}.tex`,
        metadata: {
          title,
          author,
          template,
          chapterCount: latexDoc.chapters.length
        }
      })

    } catch (error: any) {
      return this.error(error.message, { tool: this.config.name })
    }
  }

  private generateLatex(doc: LatexDocument, template: string): string {
    let latex = ''

    // Document class
    if (template === 'thesis') {
      latex += `\\documentclass[12pt]{report}\n\n`
    } else {
      latex += `\\documentclass[11pt]{article}\n\n`
    }

    // Packages
    latex += `\\usepackage[utf8]{inputenc}\n`
    latex += `\\usepackage{amsmath,amsfonts,amssymb}\n`
    latex += `\\usepackage{graphicx}\n`
    latex += `\\usepackage{cite}\n`
    latex += `\\usepackage{hyperref}\n\n`

    // Title information
    latex += `\\title{${doc.title}}\n`
    latex += `\\author{${doc.author}}\n`
    latex += `\\date{${doc.date}}\n\n`

    // Document begin
    latex += `\\begin{document}\n\n`

    // Title page
    latex += `\\maketitle\n\n`

    // Abstract
    if (doc.abstract) {
      latex += `\\begin{abstract}\n`
      latex += `${doc.abstract}\n`
      latex += `\\end{abstract}\n\n`
    }

    // Table of contents
    if (doc.chapters.length > 0) {
      latex += `\\tableofcontents\n\n`
    }

    // Chapters/Sections
    for (const chapter of doc.chapters) {
      if (template === 'thesis') {
        latex += `\\chapter{${chapter.title}}\n\n`
      } else {
        latex += `\\section{${chapter.title}}\n\n`
      }

      for (const section of chapter.sections) {
        latex += `\\section{${section.title}}\n\n`
        latex += `${section.content}\n\n`

        if (section.subsections) {
          for (const subsection of section.subsections) {
            latex += `\\subsection{${subsection.title}}\n\n`
            latex += `${subsection.content}\n\n`
          }
        }
      }
    }

    // Bibliography
    if (doc.bibliography.length > 0) {
      latex += `\\begin{thebibliography}{9}\n\n`
      for (const i in doc.bibliography) {
        const ref = doc.bibliography[i]
        latex += `\\bibitem{${ref.id || ref.key}}\n`
        latex += `${ref.author}. ${ref.title}. ${ref.journal}, ${ref.year}.\n\n`
      }
      latex += `\\end{thebibliography}\n\n`
    }

    // Document end
    latex += `\\end{document}\n`

    return latex
  }
}
