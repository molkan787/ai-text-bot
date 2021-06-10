import { promises as fs } from "fs";
import { Document, Packer, Paragraph, TextRun } from "docx";

class DocxCreatorService{

    async createFromText(filename, text){
        const doc = new Document({
            sections: [{
                properties: {},
                children: text.split("\n").map(ln => (new Paragraph({
                    text: ln
                }))),
            }]
        });
        const buffer = await Packer.toBuffer(doc)
        await fs.writeFile(filename, buffer, 'binary')
    }

}

export const docxCreatorService = new DocxCreatorService()