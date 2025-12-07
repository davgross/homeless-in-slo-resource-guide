import remarkStyleGuide from './remark-style-guide.js';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';

const remarkConfig = {
  plugins: [
    remarkFrontmatter,
    remarkGfm,
    remarkStyleGuide,
  ],
};

export default remarkConfig;
