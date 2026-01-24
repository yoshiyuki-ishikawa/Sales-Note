import Database from '@tauri-apps/plugin-sql';
import { invoke } from '@tauri-apps/api/core';
import { Sale } from '../types';

export interface SalesRepository {
    getAll(): Promise<Sale[]>;
    save(sale: Sale): Promise<string>;
    update(sale: Sale): Promise<string>;
    delete(id: string): Promise<string>;
    backup(): Promise<string>;
}

export class SqliteSalesRepository implements SalesRepository {
    private dbPromise: Promise<Database> | null = null;

    private async getDb(): Promise<Database> {
        if (!this.dbPromise) {
            if (typeof window === 'undefined') {
                throw new Error("Cannot load SQLite on server side");
            }
            this.dbPromise = Database.load('sqlite:sales.db');
        }
        return this.dbPromise;
    }

    async getAll(): Promise<Sale[]> {
        const db = await this.getDb();
        return await db.select<Sale[]>('SELECT * FROM sales ORDER BY timestamp DESC');
    }

    async save(sale: Sale): Promise<string> {
        const db = await this.getDb();
        await db.execute(
            'INSERT INTO sales (id, date, amount, memo, timestamp) VALUES ($1, $2, $3, $4, $5)',
            [sale.id, sale.date, sale.amount, sale.memo, sale.timestamp]
        );
        return await this.backup();
    }

    async update(sale: Sale): Promise<string> {
        const db = await this.getDb();
        await db.execute(
            'UPDATE sales SET date = $1, amount = $2, memo = $3 WHERE id = $4',
            [sale.date, sale.amount, sale.memo, sale.id]
        );
        return await this.backup();
    }

    async delete(id: string): Promise<string> {
        const db = await this.getDb();
        await db.execute('DELETE FROM sales WHERE id = $1', [id]);
        return await this.backup();
    }

    async backup(): Promise<string> {
        try {
            return await invoke<string>('backup_database');
        } catch (e) {
            console.error('Backup failed:', e);
            // Don't fail the whole operation if backup fails, but maybe warn?
            // For "Peace of Mind", maybe return empty string or specific error?
            // Let's propagate for now so UI knows backup failed.
            throw e;
        }
    }
}

export const salesRepository = new SqliteSalesRepository();
