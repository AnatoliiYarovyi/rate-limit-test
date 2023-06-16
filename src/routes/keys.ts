import express from 'express';

import { KeysCtrl } from '../controllers/Keys';

const router = express.Router();
const keysCtrl = new KeysCtrl();

router.get('/', (req, res, next) => keysCtrl.getKeys(req, res, next));

export default router;
