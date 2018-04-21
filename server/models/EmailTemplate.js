/**
 * ./server/models/EmailTemplate.js
 */

import mongoose, { Schema } from 'mongoose';
import Handlebars from 'handlebars';
import logger from '../logs';

logger.info('Hello from ./server/models/EmailTemplate.js');

const mongoSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  subject: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
});

const EmailTemplate = mongoose.model('EmailTemplate', mongoSchema);

function insertTemplates() {
  const templates = [
    {
      name: 'welcome',
      subject: 'Welcome to builderbook.org',
      message: `{{userName}},
        <p>
          Thanks for signing up for Builder Book!
        </p>
        <p>
          In our books, we teach you how to build complete, production-ready web apps from scratch.
        </p>

        Kelly & Timur, Team Builder Book
      `,
    },
    {
      name: 'purchase',
      subject: 'You purchased book at builderbook.org',
      message: `{{userName}},
        <p>
          Thank you for purchasing our book! You will get confirmation email from Stripe shortly.
        </p>
        <p>
          Start reading your book: <a href="{{bookUrl}}" target="_blank">{{bookTitle}}</a>
        </p>
        <p>
          If you have any questions while reading the book, 
          please fill out an issue on 
          <a href="https://github.com/builderbook/builderbook/issues" target="blank">Github</a>.
        </p>
     
        Kelly & Timur, Team Builder Book
      `,
    },
  ];

  templates.forEach(async (template) => {
    if ((await EmailTemplate.find({ name: template.name }).count()) > 0) {
      return;
    }

    EmailTemplate.create(template).catch((error) => {
      logger.error('EmailTemplate insertion error:', error);
    });
  });
}

insertTemplates();

export default async function getEmailTemplate(name, params) {
  // 1. await till method finds template by name,
  const source = await EmailTemplate.findOne({ name });

  // 2. if method finds no template - return error
  if (!source) {
    throw new Error('not found');
  }

  // 3. else, apply `Handlebars.compile()` to subject and message parameters of template
  return {
    subject: Handlebars.compile(source.subject)(params),
    message: Handlebars.compile(source.message)(params),
  };
}
