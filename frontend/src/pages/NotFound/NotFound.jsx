import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import Container from '../../components/common/Container.jsx';
import PageWrapper from '../../components/common/PageWrapper.jsx';
import Button from '../../components/ui/Button.jsx';

const NotFound = () => {
  return (
    <PageWrapper className="flex items-center justify-center bg-slate-50 min-h-[calc(100vh-140px)]">
      <Container className="text-center flex flex-col items-center max-w-md">
        <div className="p-4 bg-red-50 rounded-full text-red-600 mb-6">
          <AlertCircle className="h-12 w-12" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 mt-2">Page Not Found</h2>
        <p className="mt-4 text-slate-600 text-base leading-relaxed">
          The page you are looking for does not exist or has been relocated. Let's get you back on track.
        </p>
        <Link to="/" className="mt-8">
          <Button variant="primary">Return Home</Button>
        </Link>
      </Container>
    </PageWrapper>
  );
};

export default NotFound;
