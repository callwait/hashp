const generate = require('@babel/generator').default;

module.exports = function (babel) {
  const { types: t } = babel;
  const DEBUG_PREFIX = '__debug_';

  function createDebugLog(name, value) {
    return t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier("console"), t.identifier("log")),
        [t.stringLiteral(`#p ${name.replace(DEBUG_PREFIX, '')} => `), value]
      )
    );
  }

  function wrapWithDebug(path, name) {
    const valueNode = path.node;
    return t.callExpression(
      t.arrowFunctionExpression(
        [t.identifier('value')],
        t.blockStatement([
          createDebugLog(name, t.identifier('value')),
          t.returnStatement(t.identifier('value'))
        ])
      ),
      [valueNode]
    );
  }

  function handleDebugIdentifier(path) {
    if (path.node.name && path.node.name.startsWith(DEBUG_PREFIX)) {
      const variableName = path.node.name.slice(8);
      path.node.name = variableName;
      if (!shouldSkipDebugWrapping(path)) {
        path.replaceWith(wrapWithDebug(path, variableName));
      }
    }
  }

  function shouldSkipDebugWrapping(path) {
    const skipTypes = [
      'ObjectProperty', 'ArrayExpression', 'FunctionDeclaration',
      'FunctionExpression', 'ArrowFunctionExpression', 'ReturnStatement',
      'CallExpression', 'ClassProperty', 'ObjectPattern'
    ];
    return skipTypes.some(type =>
      path.parent.type === type &&
      (type !== 'CallExpression' || path.parent.callee === path.node) &&
      (type !== 'ObjectProperty' || path.parent.key === path.node)
    );
  }

  function handleMemberExpression(path) {
    handleDebugIdentifier(path.get('object'));
    if (t.isIdentifier(path.node.property)) {
      handleDebugIdentifier(path.get('property'));
    }
  }

  function handleVariableDeclarator(path) {
    const { node } = path;

    // Handle object pattern (destructuring)
    if (t.isObjectPattern(node.id)) {
      const debuggedProperties = [];
      const allProperties = [];

      node.id.properties.forEach(prop => {
        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
          const propertyName = prop.key.name.startsWith(DEBUG_PREFIX)
            ? prop.key.name.slice(8)
            : prop.key.name;

          allProperties.push(propertyName);

          if (prop.key.name.startsWith(DEBUG_PREFIX)) {
            debuggedProperties.push(propertyName);
            // Remove the __debug_ prefix
            prop.key.name = propertyName;
          }
        }
      });

      if (debuggedProperties.length > 0) {
        // Create a unique identifier for the temporary object
        const tempObj = path.scope.generateUidIdentifier('temp');

        // Create the temporary object declaration
        const tempObjDeclaration = t.variableDeclaration('const', [
          t.variableDeclarator(tempObj, node.init)
        ]);

        // Create individual variable declarations for all properties
        const individualDeclarations = allProperties.map(prop =>
          t.variableDeclaration('const', [
            t.variableDeclarator(
              t.identifier(prop),
              t.memberExpression(tempObj, t.identifier(prop))
            )
          ])
        );

        // Create debug log statements only for debugged properties
        const debugLogs = debuggedProperties.map(prop =>
          createDebugLog(prop, t.identifier(prop))
        );

        // Replace the original destructuring with our new statements
        path.parentPath.replaceWithMultiple([
          tempObjDeclaration,
          ...individualDeclarations,
          ...debugLogs
        ]);

        // Remove the original declarator to avoid duplicate processing
        path.remove();
      }
    }
    // Handle identifier
    else if (t.isIdentifier(node.id) && node.id.name.startsWith(DEBUG_PREFIX)) {
      const variableName = node.id.name.slice(8);
      node.id.name = variableName;

      const debugLog = createDebugLog(variableName, t.identifier(variableName));
      path.parentPath.insertAfter(debugLog);
    }

    // Handle call expression
    if (t.isCallExpression(node.init) &&
      t.isIdentifier(node.init.callee) &&
      node.init.callee.name === DEBUG_PREFIX) {
      if (node.init.arguments.length > 0) {
        const debugName = generate(node.init).code.slice(8); // Remove DEBUG_PREFIX prefix
        const debuggedInit = wrapWithDebug({ node: node.init.arguments[0] }, debugName);
        node.init = debuggedInit;
      } else {
        // Handle the case where there are no arguments
        const debugName = 'empty debug call';
        node.init = wrapWithDebug({ node: t.identifier('undefined') }, debugName);
      }
    }
  }

  function handleCallExpression(path) {
    if (t.isIdentifier(path.node.callee) && path.node.callee.name === DEBUG_PREFIX) {
      const argName = generate(path.node).code.slice(8);
      path.replaceWith(wrapWithDebug({ node: path.node.arguments[0] }, argName));
    }
  }

  function handleArrayExpression(path) {
    path.node.elements = path.node.elements.map(element => {
      if (t.isIdentifier(element) && element.name.startsWith(DEBUG_PREFIX)) {
        const elementName = element.name.slice(8);
        element.name = elementName;
        return wrapWithDebug({ node: element }, elementName);
      } else if (t.isSpreadElement(element) && t.isIdentifier(element.argument) && element.argument.name.startsWith(DEBUG_PREFIX)) {
        const spreadName = element.argument.name.slice(8);
        element.argument.name = spreadName;
        return t.spreadElement(wrapWithDebug({ node: element.argument }, spreadName));
      }
      return element;
    });
  }

  function handleArrowFunctionExpression(path) {
    if (t.isCallExpression(path.node.body) &&
      t.isIdentifier(path.node.body.callee) &&
      path.node.body.callee.name === DEBUG_PREFIX) {
        const argName = generate(path.node.body).code.slice(8);
        path.node.body = wrapWithDebug({ node: path.node.body.arguments[0] }, argName);
    }
  }

  function handleFunction(path) {
    path.get('params').forEach(param => {
      if (t.isIdentifier(param.node) && param.node.name.startsWith(DEBUG_PREFIX)) {
        const paramName = param.node.name.slice(8);
        param.node.name = paramName;
        path.get('body').unshiftContainer('body', createDebugLog(paramName, t.identifier(paramName)));
      } else if (t.isAssignmentPattern(param.node) && t.isIdentifier(param.node.left) && param.node.left.name.startsWith(DEBUG_PREFIX)) {
        const paramName = param.node.left.name.slice(8);
        param.node.left.name = paramName;
        path.get('body').unshiftContainer('body', createDebugLog(paramName, t.identifier(paramName)));
      }
    });
  }

  function handleReturnStatement(path) {
    if (path.node.argument && t.isCallExpression(path.node.argument) &&
      t.isIdentifier(path.node.argument.callee) &&
      path.node.argument.callee.name === DEBUG_PREFIX) {
      const argName = generate(path.node.argument).code.slice(8);
      path.node.argument = wrapWithDebug({ node: path.node.argument.arguments[0] }, argName);
    }
  }

  function handleClassProperty(path) {
    if (t.isIdentifier(path.node.key) && path.node.key.name.startsWith(DEBUG_PREFIX)) {
      const propertyName = path.node.key.name.slice(8);
      path.node.key.name = propertyName;
      if (path.node.value) {
        path.node.value = wrapWithDebug({ node: path.node.value }, propertyName);
      }
    }
  }

  function handleTSParameterProperty(path) {
    if (t.isIdentifier(path.node.parameter) && path.node.parameter.name.startsWith(DEBUG_PREFIX)) {
      const paramName = path.node.parameter.name.slice(8);
      path.node.parameter.name = paramName;
      path.get('body').unshiftContainer('body', createDebugLog(paramName, t.identifier(paramName)));
    }
  }

  function handleTSPropertySignature(path) {
    if (t.isIdentifier(path.node.key) && path.node.key.name.startsWith(DEBUG_PREFIX)) {
      const propertyName = path.node.key.name.slice(8);
      path.node.key.name = propertyName;
    }
  }

  function handleObjectProperty(path) {
    if (t.isIdentifier(path.node.key) && path.node.key.name.startsWith(DEBUG_PREFIX)) {
      const propertyName = path.node.key.name.slice(8);
      path.node.key.name = propertyName;

      if (path.node.value) {
        const debuggedValue = wrapWithDebug({ node: path.node.value }, propertyName);
        path.node.value = debuggedValue;
      } else {
        // If there's no value, we can't wrap it, so we'll just log the key
        const debugLog = createDebugLog(propertyName, t.identifier('undefined'));
        path.insertAfter(debugLog);
      }
    }
  }

  return {
    name: "debug-log-plugin",
    manipulateOptions(opts, parserOpts) {
      parserOpts.plugins.push("jsx", "classProperties", "typescript");
    },
    parserOverride(code, opts, parse) {
      const transformedCode = code.replace(/#p\s+/g, DEBUG_PREFIX);
      return parse(transformedCode, opts);
    },
    visitor: {
      Program(path) {
        path.traverse({
          Identifier: handleDebugIdentifier,
          ObjectProperty: handleObjectProperty,
          MemberExpression: handleMemberExpression,
          VariableDeclarator: handleVariableDeclarator,
          CallExpression: handleCallExpression,
          ArrayExpression: handleArrayExpression,
          ArrowFunctionExpression: handleArrowFunctionExpression,
          Function: handleFunction,
          ReturnStatement: handleReturnStatement,
          ClassProperty: handleClassProperty,
          TSParameterProperty: handleTSParameterProperty,
          TSPropertySignature: handleTSPropertySignature
        });
      }
    }
  };
};