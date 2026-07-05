import os

def patch_file(path, search, replace):
    if not os.path.exists(path): return
    with open(path, 'r') as f:
        content = f.read()
    if search in content:
        content = content.replace(search, replace)
        with open(path, 'w') as f:
            f.write(content)

patch_file('src/components/admin/AdminOrderListener.tsx',
           '      isFirstLoad.current = false;\n    });',
           '      isFirstLoad.current = false;\n    }, (err) => console.error("AdminOrderListener error:", err));')

patch_file('src/components/AccountPage.tsx',
           '      });\n    });',
           '      });\n    }, (err) => console.error("Addresses error:", err));')

patch_file('src/components/AccountPage.tsx',
           '    const unsub = onSnapshot(q, (snap) => {\n      setPasskeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));\n    });',
           '    const unsub = onSnapshot(q, (snap) => {\n      setPasskeys(snap.docs.map(d => ({ id: d.id, ...d.data() })));\n    }, (err) => console.error("Passkeys error:", err));')

patch_file('src/components/OrderHistory.tsx',
           '      setIsLoading(false);\n    });',
           '      setIsLoading(false);\n    }, (err) => console.error("OrderHistory error:", err));')

patch_file('src/services/notificationService.ts',
           '    callback(notifications);\n  });',
           '    callback(notifications);\n  }, (err) => console.error("Notifications error:", err));')
