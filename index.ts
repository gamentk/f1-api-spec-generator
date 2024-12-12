import * as xlsx from 'xlsx';
import fs from 'fs';

// Import your JSON here
import json from './data/min/EHR-002/REQ_EHR-002_410415_20241128024502.json';

class APISpecGenerator {
    private readonly data: object;

    private prepareSheetData: string[][] = [
        ['Input Parameter', 'Field', 'Type', 'Remark'],
    ];

    public constructor(data: object) {
        this.data = data;
    }

    private getType(value: unknown) {
        const typeOfValue = typeof value;

        switch (typeOfValue) {
            case 'string':
            case 'boolean':
                return typeOfValue;
            case 'number':
                return 'int';
            case 'object':
                return Array.isArray(value) ? 'object array' : 'object';
        }
    }

    private appendEmptyRow() {
        const headerRow = this.prepareSheetData[0];

        this.prepareSheetData.push(
            Array.from({ length: headerRow.length }, () => '')
        );
    }

    private appendRow(key: string, value: any, fromParent?: string) {
        const v =
            Array.isArray(value) && typeof value[0] !== 'object'
                ? JSON.stringify(value.slice(0, 3))
                : typeof value !== 'object'
                ? value
                : '';

        this.prepareSheetData.push([
            fromParent ? `${fromParent}{JSON}` : '',
            key,
            this.getType(value),
            typeof value === 'string' ? `"${v}"` : v,
        ]);
    }

    private traverseData(jsonObject: object, fromParent?: string) {
        const entries = Object.entries(jsonObject);

        if (fromParent) this.appendEmptyRow();

        entries.forEach(([key, value]) => {
            if (Array.isArray(value)) {
                this.appendRow(key, value, fromParent);

                if (value.length > 0 && typeof value[0] === 'object') {
                    this.traverseData(value[0], key);
                }
            } else if (typeof value === 'object') {
                this.appendRow(key, value, fromParent);

                this.traverseData(value, key);
            } else {
                this.appendRow(key, value, fromParent);
            }

            fromParent = undefined;
        });
    }

    public generate() {
        this.traverseData(this.data);

        return this;
    }

    public csv() {
        const worksheet = xlsx.utils.aoa_to_sheet(this.prepareSheetData);
        const csv = xlsx.utils.sheet_to_csv(worksheet);

        return csv;
    }
}

function init() {
    const csv = new APISpecGenerator(json).generate().csv();

    fs.writeFileSync('./output/spec.csv', csv);
}

init();
