import readXlsxFile from 'read-excel-file/node'

class KeywordsReaderService{

    async read(filename){
        const rows = await readXlsxFile(filename)
        const keywords = []
        const len = rows.length
        for(let i = 0; i < len; i++){
            const row = rows[i]
            if(typeof row[1] !== 'string'){
                keywords.push(row[0])
            }
        }
        return keywords
    }

}

export const keywordsReaderService = new KeywordsReaderService()