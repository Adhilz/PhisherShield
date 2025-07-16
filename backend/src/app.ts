import express from 'express';
import scanRoute from './routes/scan';

const app = express();
app.use(express.json());

app.use('/api', scanRoute);

app.listen(4000, () => {
    console.log('Server running on port 4000');
});