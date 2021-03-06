﻿// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

namespace Microsoft.DocAsCode.EntityModel
{
    using System;

    public interface ILoggerListener : IDisposable
    {
        LogLevel LogLevelThreshold { get; set; }
        void WriteLine(ILogItem item);
        void Flush();
    }
}
