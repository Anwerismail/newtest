import { ENV } from '../config/env.js';
import { logInfo, logError, logBusiness } from './logger.service.js';

/**
 * Deployment Service - Integrates with Vercel, Netlify, and other deployment providers
 * Handles real deployments of projects to production
 */

// Vercel API Configuration
const VERCEL_API_URL = 'https://api.vercel.com';
const VERCEL_TOKEN = ENV.VERCEL?.API_TOKEN || process.env.VERCEL_API_TOKEN;

// Netlify API Configuration
const NETLIFY_API_URL = 'https://api.netlify.com/api/v1';
const NETLIFY_TOKEN = ENV.NETLIFY?.API_TOKEN || process.env.NETLIFY_API_TOKEN;

// ========================================
// VERCEL DEPLOYMENT FUNCTIONS
// ========================================

/**
 * Deploy to Vercel
 * @param {Object} project - Project object from database
 * @param {Object} options - Deployment options
 */
export const deployToVercel = async (project, options = {}) => {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error('VERCEL_API_TOKEN not configured');
    }

    logInfo('Starting Vercel deployment', {
      projectId: project._id,
      projectName: project.name,
    });

    const deploymentPayload = {
      name: project.slug || project.name.toLowerCase().replace(/\s+/g, '-'),
      files: await prepareProjectFiles(project),
      projectSettings: {
        framework: project.template?.type === 'nextjs' ? 'nextjs' : 
                   project.template?.type === 'react' ? 'create-react-app' :
                   project.template?.type === 'vue' ? 'vue' : null,
        buildCommand: options.buildCommand || 'npm run build',
        outputDirectory: options.outputDirectory || 'dist',
        installCommand: 'npm install',
      },
      target: options.production ? 'production' : 'preview',
    };

    const response = await fetch(`${VERCEL_API_URL}/v13/deployments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deploymentPayload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Vercel deployment failed');
    }

    const deployment = await response.json();

    logBusiness('Vercel deployment created', {
      projectId: project._id,
      deploymentId: deployment.id,
      url: deployment.url,
    });

    // Poll for deployment status
    const finalStatus = await pollDeploymentStatus('vercel', deployment.id);

    return {
      success: true,
      provider: 'VERCEL',
      deploymentId: deployment.id,
      url: `https://${deployment.url}`,
      status: finalStatus.state,
      buildTime: finalStatus.buildTime,
      createdAt: new Date(deployment.createdAt),
    };
  } catch (error) {
    logError('Vercel deployment failed', error, {
      projectId: project._id,
      projectName: project.name,
    });
    throw error;
  }
};

/**
 * Get Vercel deployment status
 */
export const getVercelDeploymentStatus = async (deploymentId) => {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error('VERCEL_API_TOKEN not configured');
    }

    const response = await fetch(`${VERCEL_API_URL}/v13/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get deployment status');
    }

    const deployment = await response.json();

    return {
      id: deployment.id,
      state: deployment.state, // BUILDING, ERROR, READY, CANCELED
      url: deployment.url,
      createdAt: deployment.createdAt,
      buildTime: deployment.buildingAt ? Date.now() - deployment.buildingAt : null,
    };
  } catch (error) {
    logError('Failed to get Vercel deployment status', error, { deploymentId });
    throw error;
  }
};

/**
 * Cancel Vercel deployment
 */
export const cancelVercelDeployment = async (deploymentId) => {
  try {
    if (!VERCEL_TOKEN) {
      throw new Error('VERCEL_API_TOKEN not configured');
    }

    const response = await fetch(`${VERCEL_API_URL}/v13/deployments/${deploymentId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to cancel deployment');
    }

    logInfo('Vercel deployment canceled', { deploymentId });

    return { success: true };
  } catch (error) {
    logError('Failed to cancel Vercel deployment', error, { deploymentId });
    throw error;
  }
};

// ========================================
// NETLIFY DEPLOYMENT FUNCTIONS
// ========================================

/**
 * Deploy to Netlify
 */
export const deployToNetlify = async (project, options = {}) => {
  try {
    if (!NETLIFY_TOKEN) {
      throw new Error('NETLIFY_API_TOKEN not configured');
    }

    logInfo('Starting Netlify deployment', {
      projectId: project._id,
      projectName: project.name,
    });

    // Create site if doesn't exist
    let siteId = project.deployment?.netlify?.siteId;
    
    if (!siteId) {
      const site = await createNetlifySite(project);
      siteId = site.id;
    }

    // Prepare deployment files
    const files = await prepareProjectFiles(project);
    
    // Create deployment
    const response = await fetch(`${NETLIFY_API_URL}/sites/${siteId}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files,
        draft: !options.production,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Netlify deployment failed');
    }

    const deployment = await response.json();

    logBusiness('Netlify deployment created', {
      projectId: project._id,
      deploymentId: deployment.id,
      url: deployment.url,
    });

    return {
      success: true,
      provider: 'NETLIFY',
      deploymentId: deployment.id,
      siteId: deployment.site_id,
      url: deployment.url,
      status: deployment.state,
      createdAt: new Date(deployment.created_at),
    };
  } catch (error) {
    logError('Netlify deployment failed', error, {
      projectId: project._id,
      projectName: project.name,
    });
    throw error;
  }
};

/**
 * Create Netlify site
 */
const createNetlifySite = async (project) => {
  const response = await fetch(`${NETLIFY_API_URL}/sites`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: project.slug || project.name.toLowerCase().replace(/\s+/g, '-'),
      custom_domain: project.domain?.customDomain,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create Netlify site');
  }

  return response.json();
};

/**
 * Get Netlify deployment status
 */
export const getNetlifyDeploymentStatus = async (deploymentId) => {
  try {
    if (!NETLIFY_TOKEN) {
      throw new Error('NETLIFY_API_TOKEN not configured');
    }

    const response = await fetch(`${NETLIFY_API_URL}/deploys/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get deployment status');
    }

    const deployment = await response.json();

    return {
      id: deployment.id,
      state: deployment.state, // ready, error, building, etc.
      url: deployment.url,
      createdAt: deployment.created_at,
      buildTime: deployment.deploy_time,
    };
  } catch (error) {
    logError('Failed to get Netlify deployment status', error, { deploymentId });
    throw error;
  }
};

// ========================================
// GENERIC DEPLOYMENT FUNCTIONS
// ========================================

/**
 * Deploy project to selected provider
 */
export const deployProject = async (project, provider = 'VERCEL', options = {}) => {
  try {
    logBusiness('Starting project deployment', {
      projectId: project._id,
      projectName: project.name,
      provider,
    });

    let result;

    switch (provider.toUpperCase()) {
      case 'VERCEL':
        result = await deployToVercel(project, options);
        break;
      case 'NETLIFY':
        result = await deployToNetlify(project, options);
        break;
      case 'AWS':
        result = await deployToAWS(project, options);
        break;
      case 'CUSTOM':
        result = await deployToCustom(project, options);
        break;
      default:
        throw new Error(`Unsupported deployment provider: ${provider}`);
    }

    logBusiness('Project deployment completed', {
      projectId: project._id,
      provider,
      url: result.url,
    });

    return result;
  } catch (error) {
    logError('Project deployment failed', error, {
      projectId: project._id,
      provider,
    });
    throw error;
  }
};

/**
 * Get deployment status (provider agnostic)
 */
export const getDeploymentStatus = async (provider, deploymentId) => {
  switch (provider.toUpperCase()) {
    case 'VERCEL':
      return getVercelDeploymentStatus(deploymentId);
    case 'NETLIFY':
      return getNetlifyDeploymentStatus(deploymentId);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

/**
 * Poll deployment status until complete
 */
const pollDeploymentStatus = async (provider, deploymentId, maxAttempts = 60, interval = 5000) => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    const status = await getDeploymentStatus(provider, deploymentId);

    if (status.state === 'READY' || status.state === 'ready') {
      return status;
    }

    if (status.state === 'ERROR' || status.state === 'error' || status.state === 'CANCELED') {
      throw new Error(`Deployment failed with status: ${status.state}`);
    }

    // Still building, wait and retry
    await new Promise(resolve => setTimeout(resolve, interval));
    attempts++;
  }

  throw new Error('Deployment timeout: took too long to complete');
};

// ========================================
// PROJECT FILES PREPARATION
// ========================================

/**
 * Prepare project files for deployment
 */
const prepareProjectFiles = async (project) => {
  try {
    const files = {};

    // Generate HTML from project content
    const htmlContent = generateHTML(project);
    files['index.html'] = htmlContent;

    // Generate CSS from project styles
    if (project.content?.customCSS) {
      files['styles.css'] = project.content.customCSS;
    }

    // Generate JS from project scripts
    if (project.content?.customJS) {
      files['script.js'] = project.content.customJS;
    }

    // Add package.json if needed
    if (project.template?.type === 'react' || project.template?.type === 'nextjs') {
      files['package.json'] = JSON.stringify(generatePackageJson(project), null, 2);
    }

    // Add assets references (images, videos, etc.)
    if (project.assets && project.assets.length > 0) {
      // Assets are already uploaded to Cloudinary, just reference them
      logInfo('Project has assets', { count: project.assets.length });
    }

    return files;
  } catch (error) {
    logError('Failed to prepare project files', error, { projectId: project._id });
    throw error;
  }
};

/**
 * Generate HTML from project content
 */
const generateHTML = (project) => {
  const pages = project.pages || [{ path: '/', title: project.name, content: project.content }];
  const mainPage = pages[0];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.seo?.title || project.name}</title>
  <meta name="description" content="${project.seo?.description || ''}">
  <meta name="keywords" content="${project.seo?.keywords?.join(', ') || ''}">
  ${project.seo?.favicon ? `<link rel="icon" href="${project.seo.favicon}">` : ''}
  ${project.content?.customCSS ? '<link rel="stylesheet" href="styles.css">' : ''}
</head>
<body>
  ${mainPage.content?.html || '<h1>' + project.name + '</h1><p>Welcome to ' + project.name + '</p>'}
  ${project.content?.customJS ? '<script src="script.js"></script>' : ''}
  
  <!-- Evolyte Analytics -->
  <script>
    (function() {
      const projectId = '${project._id}';
      fetch('${ENV.API_URL}/api/v1/projects/${project._id}/visit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    })();
  </script>
</body>
</html>`;
};

/**
 * Generate package.json for modern frameworks
 */
const generatePackageJson = (project) => {
  const basePackage = {
    name: project.slug || project.name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    private: true,
  };

  if (project.template?.type === 'react') {
    return {
      ...basePackage,
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '^5.0.1',
      },
    };
  }

  if (project.template?.type === 'nextjs') {
    return {
      ...basePackage,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
      },
      dependencies: {
        next: '^14.0.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
    };
  }

  return basePackage;
};

// ========================================
// AWS & CUSTOM DEPLOYMENT (Placeholders)
// ========================================

/**
 * Deploy to AWS S3 + CloudFront
 */
const deployToAWS = async (project, options = {}) => {
  // TODO: Implement AWS deployment
  throw new Error('AWS deployment not yet implemented');
};

/**
 * Deploy to custom server via FTP/SFTP
 */
const deployToCustom = async (project, options = {}) => {
  // TODO: Implement custom deployment
  throw new Error('Custom deployment not yet implemented');
};

// ========================================
// DNS VERIFICATION
// ========================================

/**
 * Verify DNS configuration for custom domain
 */
export const verifyDNS = async (domain, provider = 'VERCEL') => {
  try {
    logInfo('Verifying DNS configuration', { domain, provider });

    // Real DNS verification using DNS lookup
    const dns = await import('dns').then(m => m.promises);
    
    let recordsToCheck = [];
    
    if (provider === 'VERCEL') {
      recordsToCheck = ['76.76.21.21']; // Vercel IP
    } else if (provider === 'NETLIFY') {
      recordsToCheck = ['75.2.60.5']; // Netlify IP
    }

    try {
      const addresses = await dns.resolve4(domain);
      const isVerified = recordsToCheck.some(ip => addresses.includes(ip));

      if (isVerified) {
        logInfo('DNS verification successful', { domain });
        return {
          verified: true,
          provider,
          records: addresses,
        };
      }

      return {
        verified: false,
        provider,
        records: addresses,
        message: 'DNS not pointing to correct provider',
      };
    } catch (error) {
      return {
        verified: false,
        provider,
        error: error.message,
        message: 'DNS records not found or domain not configured',
      };
    }
  } catch (error) {
    logError('DNS verification failed', error, { domain, provider });
    throw error;
  }
};

export default {
  deployProject,
  deployToVercel,
  deployToNetlify,
  getDeploymentStatus,
  getVercelDeploymentStatus,
  getNetlifyDeploymentStatus,
  cancelVercelDeployment,
  verifyDNS,
};
