import { createRoot } from 'react-dom/client';
import Home from '../app/page';
import '../app/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('LumberPlan could not find its application container.');
createRoot(root).render(<Home />);
